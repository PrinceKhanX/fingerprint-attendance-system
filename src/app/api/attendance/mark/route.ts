import { NextRequest, NextResponse } from 'next/server'
import { findAttendanceForDay } from '@/lib/attendance'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { fingerprint_id, class_id } = body

  if (!fingerprint_id || !class_id) {
    return NextResponse.json({ error: 'Missing required fields: fingerprint_id, class_id' }, { status: 400 })
  }

  const student = await prisma.student.findUnique({
    where: { fingerprint_id },
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found for this fingerprint' }, { status: 404 })
  }

  const classRecord = await prisma.class.findUnique({
    where: { id: class_id },
  })

  if (!classRecord) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_classId: {
        studentId: student.id,
        classId: class_id,
      },
    },
  })

  if (!enrollment) {
    return NextResponse.json({ error: 'Student is not enrolled in this class' }, { status: 403 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const existing = await findAttendanceForDay(student.id, class_id, today)

  if (existing) {
    return NextResponse.json(
      {
        message: 'Attendance already recorded for today',
        attendance: existing,
        student: {
          id: student.id,
          student_id: student.student_id,
          fingerprint_id: student.fingerprint_id,
        },
      },
      { status: 200 }
    )
  }

  const attendance = await prisma.attendance.create({
    data: {
      studentId: student.id,
      classId: class_id,
      status: 'PRESENT',
      marked_by: 'SENSOR',
    },
    include: {
      student: {
        select: {
          id: true,
          student_id: true,
          fingerprint_id: true,
          user: { select: { name: true, email: true } },
        },
      },
      class: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ attendance }, { status: 201 })
}
