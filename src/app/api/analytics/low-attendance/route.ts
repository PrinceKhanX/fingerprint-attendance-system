import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all students with their attendance records
    const students = await prisma.student.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        attendance: true,
        enrollments: {
          include: {
            class: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    const lowAttendanceStudents = students
      .map((student) => {
        const totalAttendance = student.attendance.length
        const presentCount = student.attendance.filter(
          (att) => att.status === 'PRESENT' || att.status === 'LATE'
        ).length

        const attendanceRate = totalAttendance > 0
          ? Math.round((presentCount / totalAttendance) * 100)
          : 0

        return {
          studentId: student.id,
          student_id: student.student_id,
          name: student.user.name,
          email: student.user.email,
          attendanceRate,
          totalAttendance,
          presentCount,
          absentCount: totalAttendance - presentCount,
          classes: student.enrollments.map((e) => e.class.name).join(', '),
        }
      })
      .filter((student) => student.attendanceRate < 75)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)

    return NextResponse.json({ data: lowAttendanceStudents })
  } catch (error) {
    console.error('Error fetching low attendance students:', error)
    return NextResponse.json({ error: 'Failed to fetch low attendance students' }, { status: 500 })
  }
}
