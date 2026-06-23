import { AttendanceStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { findAttendanceForDay, getDayBounds, upsertManualAttendance } from '@/lib/attendance'
import { notifyAttendanceAlert } from '@/lib/notify'
import { authorizeTeacher, teacherUnauthorized } from '@/lib/teacherAuth'
import { prisma } from '@/lib/prisma'

const validStatuses: AttendanceStatus[] = ['PRESENT', 'LATE', 'ABSENT']

export async function GET(request: NextRequest) {
  const teacher = await authorizeTeacher(request)
  if (!teacher) return teacherUnauthorized()

  const classId = request.nextUrl.searchParams.get('classId')
  const date = request.nextUrl.searchParams.get('date')

  if (!classId || !date) {
    return NextResponse.json({ error: 'Missing required query params: classId, date' }, { status: 400 })
  }

  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.teacherId },
  })

  if (!classRecord) {
    return NextResponse.json({ error: 'Class not found or not assigned to you' }, { status: 404 })
  }

  const { start, end } = getDayBounds(date)

  const enrollments = await prisma.enrollment.findMany({
    where: { classId },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true } },
          attendance: {
            where: {
              classId,
              timestamp: { gte: start, lte: end },
            },
          },
        },
      },
    },
    orderBy: { student: { user: { name: 'asc' } } },
  })

  const students = enrollments.map(({ student }) => ({
    id: student.id,
    student_id: student.student_id,
    name: student.user.name,
    email: student.user.email,
    status: student.attendance[0]?.status ?? null,
    attendanceId: student.attendance[0]?.id ?? null,
    marked_by: student.attendance[0]?.marked_by ?? null,
  }))

  return NextResponse.json({
    class: { id: classRecord.id, name: classRecord.name },
    date,
    students,
  })
}

export async function POST(request: NextRequest) {
  const teacher = await authorizeTeacher(request)
  if (!teacher) return teacherUnauthorized()

  const body = await request.json()
  const { classId, date, records } = body

  if (!classId || !date || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json(
      { error: 'Missing required fields: classId, date, records' },
      { status: 400 }
    )
  }

  const classRecord = await prisma.class.findFirst({
    where: { id: classId, teacherId: teacher.teacherId },
  })

  if (!classRecord) {
    return NextResponse.json({ error: 'Class not found or not assigned to you' }, { status: 404 })
  }

  const studentIds = records.map((r: { studentId: string }) => r.studentId)
  const enrolled = await prisma.enrollment.findMany({
    where: { classId, studentId: { in: studentIds } },
    select: { studentId: true },
  })
  const enrolledIds = new Set(enrolled.map((e) => e.studentId))

  const results = []

  for (const record of records) {
    const { studentId, status } = record as { studentId: string; status: AttendanceStatus }

    if (!studentId || !status) {
      return NextResponse.json({ error: 'Each record requires studentId and status' }, { status: 400 })
    }

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 })
    }

    if (!enrolledIds.has(studentId)) {
      return NextResponse.json({ error: `Student ${studentId} is not enrolled in this class` }, { status: 403 })
    }

    const previous = await findAttendanceForDay(studentId, classId, date)
    const attendance = await upsertManualAttendance(studentId, classId, date, status)

    if (
      (status === 'LATE' || status === 'ABSENT') &&
      previous?.status !== status
    ) {
      await notifyAttendanceAlert(studentId, classId, status, date)
    }

    results.push(attendance)
  }

  return NextResponse.json({ saved: results.length, attendance: results })
}
