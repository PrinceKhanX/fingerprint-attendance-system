import { AttendanceStatus } from '@prisma/client'
import { prisma } from './prisma'

export function getDayBounds(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00`)
  const end = new Date(`${dateStr}T23:59:59.999`)
  return { start, end }
}

export function timestampForDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`)
}

export async function findAttendanceForDay(studentId: string, classId: string, dateStr: string) {
  const { start, end } = getDayBounds(dateStr)

  return prisma.attendance.findFirst({
    where: {
      studentId,
      classId,
      timestamp: { gte: start, lte: end },
    },
  })
}

export async function upsertManualAttendance(
  studentId: string,
  classId: string,
  dateStr: string,
  status: AttendanceStatus
) {
  const existing = await findAttendanceForDay(studentId, classId, dateStr)

  if (existing) {
    return prisma.attendance.update({
      where: { id: existing.id },
      data: { status, marked_by: 'MANUAL', timestamp: timestampForDate(dateStr) },
    })
  }

  return prisma.attendance.create({
    data: {
      studentId,
      classId,
      status,
      marked_by: 'MANUAL',
      timestamp: timestampForDate(dateStr),
    },
  })
}
