import { NextRequest, NextResponse } from 'next/server'
import { getDayBounds } from '@/lib/attendance'
import { isClassScheduledToday, todayString } from '@/lib/schedule'
import { authorizeTeacher, teacherUnauthorized } from '@/lib/teacherAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const teacher = await authorizeTeacher(request)
  if (!teacher) return teacherUnauthorized()

  const date = request.nextUrl.searchParams.get('date') ?? todayString()
  const { start, end } = getDayBounds(date)

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.teacherId },
    include: {
      enrollments: { select: { studentId: true } },
      attendance: {
        where: { timestamp: { gte: start, lte: end }, status: 'PRESENT' },
        select: { studentId: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const todayClasses = classes
    .map((c) => {
      const enrolledIds = new Set(c.enrollments.map((e) => e.studentId))
      const presentIds = new Set(
        c.attendance.map((a) => a.studentId).filter((id) => enrolledIds.has(id))
      )

      return {
        id: c.id,
        name: c.name,
        schedule: c.schedule,
        isScheduledToday: isClassScheduledToday(c.schedule),
        totalEnrolled: c.enrollments.length,
        presentToday: presentIds.size,
      }
    })
    .filter((c) => c.isScheduledToday)

  const allClasses = classes.map((c) => {
    const enrolledIds = new Set(c.enrollments.map((e) => e.studentId))
    const presentIds = new Set(
      c.attendance.map((a) => a.studentId).filter((id) => enrolledIds.has(id))
    )

    return {
      id: c.id,
      name: c.name,
      schedule: c.schedule,
      isScheduledToday: isClassScheduledToday(c.schedule),
      totalEnrolled: c.enrollments.length,
      presentToday: presentIds.size,
    }
  })

  const displayedClasses = todayClasses.length > 0 ? todayClasses : allClasses
  const totalStudents = displayedClasses.reduce((sum, c) => sum + c.totalEnrolled, 0)
  const totalPresent = displayedClasses.reduce((sum, c) => sum + c.presentToday, 0)

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
    },
  })
}
