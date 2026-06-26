import { NextRequest, NextResponse } from 'next/server'
import { getDayBounds } from '@/lib/attendance'
import { isClassScheduledToday, todayString } from '@/lib/schedule'
import { authorizeTeacher, teacherUnauthorized } from '@/lib/teacherAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const teacher = await authorizeTeacher(request)
  if (!teacher) return teacherUnauthorized()

  // Fetch teacher's name
  const user = await prisma.user.findUnique({
    where: { id: teacher.userId },
    select: { name: true },
  })

  const date = request.nextUrl.searchParams.get('date') ?? todayString()
  const { start, end } = getDayBounds(date)

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.teacherId },
    include: {
      enrollments: { 
        select: { 
          studentId: true,
          student: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                }
              },
              student_id: true,
            }
          }
        } 
      },
      attendance: {
        where: { timestamp: { gte: start, lte: end } },
        select: { 
          studentId: true,
          status: true,
          timestamp: true,
          marked_by: true,
        },
        orderBy: { timestamp: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Calculate attendance rates per student
  const studentAttendanceRates = new Map<string, { present: number, total: number }>()
  
  classes.forEach(c => {
    c.enrollments.forEach(e => {
      const studentId = e.studentId
      if (!studentAttendanceRates.has(studentId)) {
        studentAttendanceRates.set(studentId, { present: 0, total: 0 })
      }
      const stats = studentAttendanceRates.get(studentId)!
      stats.total++
      const attendance = c.attendance.find(a => a.studentId === studentId)
      if (attendance && attendance.status === 'PRESENT') {
        stats.present++
      }
    })
  })

  // Calculate students at risk (<75% attendance)
  let studentsAtRisk = 0
  studentAttendanceRates.forEach(stats => {
    const rate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0
    if (rate < 75) studentsAtRisk++
  })

  const todayClasses = classes
    .map((c) => {
      const enrolledIds = new Set(c.enrollments.map((e) => e.studentId))
      const presentIds = new Set(
        c.attendance.filter((a) => a.status === 'PRESENT').map((a) => a.studentId).filter((id) => enrolledIds.has(id))
      )
      const lateIds = new Set(
        c.attendance.filter((a) => a.status === 'LATE').map((a) => a.studentId).filter((id) => enrolledIds.has(id))
      )

      return {
        id: c.id,
        name: c.name,
        schedule: c.schedule,
        isScheduledToday: isClassScheduledToday(c.schedule),
        totalEnrolled: c.enrollments.length,
        presentToday: presentIds.size,
        lateToday: lateIds.size,
        attendanceRate: c.enrollments.length > 0 ? Math.round((presentIds.size / c.enrollments.length) * 100) : 0,
        recentActivity: c.attendance.slice(0, 10).map(a => {
          const enrollment = c.enrollments.find((e: any) => e.studentId === a.studentId)
          return {
            studentId: a.studentId,
            studentName: enrollment?.student?.user?.name || 'Unknown',
            studentEmail: enrollment?.student?.user?.email || '',
            status: a.status,
            timestamp: a.timestamp.toISOString(),
            markedBy: a.marked_by,
          }
        }),
        enrollments: c.enrollments,
        attendance: c.attendance,
      }
    })
    .filter((c) => c.isScheduledToday)

  const allClasses = classes.map((c) => {
    const enrolledIds = new Set(c.enrollments.map((e) => e.studentId))
    const presentIds = new Set(
      c.attendance.filter((a) => a.status === 'PRESENT').map((a) => a.studentId).filter((id) => enrolledIds.has(id))
    )
    const lateIds = new Set(
      c.attendance.filter((a) => a.status === 'LATE').map((a) => a.studentId).filter((id) => enrolledIds.has(id))
    )

    return {
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      isScheduledToday: isClassScheduledToday(c.schedule),
      totalEnrolled: c.enrollments.length,
      presentToday: presentIds.size,
      lateToday: lateIds.size,
      attendanceRate: c.enrollments.length > 0 ? Math.round((presentIds.size / c.enrollments.length) * 100) : 0,
      recentActivity: c.attendance.slice(0, 10).map(a => {
        const enrollment = c.enrollments.find((e: any) => e.studentId === a.studentId)
        return {
          studentId: a.studentId,
          studentName: enrollment?.student?.user?.name || 'Unknown',
          studentEmail: enrollment?.student?.user?.email || '',
          status: a.status,
          timestamp: a.timestamp.toISOString(),
          markedBy: a.marked_by,
        }
      }),
      enrollments: c.enrollments,
      attendance: c.attendance,
    }
  })

  const displayedClasses = todayClasses.length > 0 ? todayClasses : allClasses
  const totalStudents = displayedClasses.reduce((sum, c) => sum + c.totalEnrolled, 0)
  const totalPresent = displayedClasses.reduce((sum, c) => sum + c.presentToday, 0)

  // Combine all recent activity across classes
  const allRecentActivity = displayedClasses.flatMap(c => c.recentActivity)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20)

  // Get absentees needing follow-up
  const absenteesNeedingFollowUp = displayedClasses.flatMap((c: any) => {
    const enrolledIds = new Set(c.enrollments.map((e: any) => e.studentId))
    const presentIds = new Set(c.attendance.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').map((a: any) => a.studentId))
    return c.enrollments
      .filter((e: any) => !presentIds.has(e.studentId))
      .map((e: any) => ({
        studentId: e.studentId,
        studentName: e.student?.user?.name || 'Unknown',
        studentEmail: e.student?.user?.email || '',
        className: c.name,
        classId: c.id,
      }))
  })

  return NextResponse.json({
    date,
    classes: displayedClasses,
    showingAllClasses: todayClasses.length === 0,
    summary: {
      classCount: displayedClasses.length,
      totalStudents,
      totalPresent,
      attendanceRate:
        totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0,
      studentsAtRisk,
    },
    teacherName: user?.name ?? '',
    recentActivity: allRecentActivity,
    absenteesNeedingFollowUp,
  })
}
