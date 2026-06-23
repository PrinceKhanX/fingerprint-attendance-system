import type { AttendanceStatus } from '@prisma/client'
import { buildAttendanceEmail, sendEmail } from './email'
import { prisma } from './prisma'
import { sendPushToEmail } from './push'
import { buildAttendanceSms, sendSms } from './sms'

export async function notifyAttendanceAlert(
  studentId: string,
  classId: string,
  status: AttendanceStatus,
  date: string
) {
  if (status !== 'LATE' && status !== 'ABSENT') return

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { name: true, email: true } },
    },
  })

  const classRecord = await prisma.class.findUnique({
    where: { id: classId },
    select: { name: true },
  })

  if (!student || !classRecord) return

  const studentName = student.user.name
  const className = classRecord.name
  const { subject, text } = buildAttendanceEmail(studentName, className, status, date)
  const smsText = buildAttendanceSms(studentName, className, status, date)
  const pushBody = `${studentName} was marked ${status} for ${className} on ${date}.`

  await Promise.allSettled([
    sendEmail(student.guardian_email, subject, text),
    student.guardian_phone ? sendSms(student.guardian_phone, smsText) : Promise.resolve(true),
    sendPushToEmail(student.guardian_email, 'GUARDIAN', {
      title: 'Attendance Alert',
      body: pushBody,
      url: '/guardian/dashboard',
    }),
    sendPushToEmail(student.user.email, 'STUDENT', {
      title: 'Attendance Update',
      body: pushBody,
      url: '/student/dashboard',
    }),
  ])
}
