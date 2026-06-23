import { AttendanceStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { aggregateDayStatus, attendancePercentage } from '@/lib/schedule'
import { authorizeStudent, studentUnauthorized } from '@/lib/studentAuth'
import { prisma } from '@/lib/prisma'

function monthBounds(monthStr: string) {
  const [year, month] = monthStr.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)
  return { start, end }
}

function dateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function GET(request: NextRequest) {
  const auth = await authorizeStudent(request)
  if (!auth) return studentUnauthorized()

  const month = request.nextUrl.searchParams.get('month')
  const now = new Date()
  const monthStr =
    month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { start, end } = monthBounds(monthStr)

  const records = await prisma.attendance.findMany({
    where: {
      studentId: auth.studentId,
      timestamp: { gte: start, lte: end },
    },
    include: {
      class: { select: { name: true } },
    },
    orderBy: { timestamp: 'desc' },
  })

  const allRecords = await prisma.attendance.findMany({
    where: { studentId: auth.studentId },
    select: { status: true },
  })

  let present = 0
  let late = 0
  let absent = 0
  for (const r of allRecords) {
    if (r.status === 'PRESENT') present++
    else if (r.status === 'LATE') late++
    else absent++
  }

  const byDate: Record<string, AttendanceStatus[]> = {}
  for (const r of records) {
    const key = dateKey(r.timestamp)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(r.status)
  }

  const calendar: Record<string, AttendanceStatus> = {}
  for (const [day, statuses] of Object.entries(byDate)) {
    const aggregated = aggregateDayStatus(statuses)
    if (aggregated) calendar[day] = aggregated
  }

  const enrollments = await prisma.enrollment.count({
    where: { studentId: auth.studentId },
  })

  return NextResponse.json({
    student: {
      name: auth.student.user.name,
      student_id: auth.student.student_id,
    },
    month: monthStr,
    stats: {
      enrolledClasses: enrollments,
      present,
      late,
      absent,
      totalRecords: allRecords.length,
      attendancePercentage: attendancePercentage(present, late, absent),
    },
    calendar,
    records: records.map((r) => ({
      id: r.id,
      date: dateKey(r.timestamp),
      status: r.status,
      className: r.class.name,
      marked_by: r.marked_by,
      timestamp: r.timestamp,
    })),
  })
}
