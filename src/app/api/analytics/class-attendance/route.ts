import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Get all classes with their enrollments
    const classes = await prisma.class.findMany({
      include: {
        enrollments: {
          include: {
            student: {
              include: {
                attendance: true,
              },
            },
          },
        },
      },
    })

    const data = classes.map((cls) => {
      const totalStudents = cls.enrollments.length
      let presentCount = 0
      let totalAttendanceRecords = 0

      cls.enrollments.forEach((enrollment) => {
        enrollment.student.attendance.forEach((att) => {
          totalAttendanceRecords++
          if (att.status === 'PRESENT' || att.status === 'LATE') {
            presentCount++
          }
        })
      })

      const attendanceRate = totalAttendanceRecords > 0
        ? Math.round((presentCount / totalAttendanceRecords) * 100)
        : 0

      return {
        classId: cls.id,
        className: cls.name,
        attendanceRate,
        totalStudents,
        presentCount,
        totalAttendanceRecords,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching class attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch class attendance data' }, { status: 500 })
  }
}
