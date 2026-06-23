import nodemailer from 'nodemailer'
import type { AttendanceStatus } from '@prisma/client'

function getTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
  })
}

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<boolean> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@attendance.local'
  const transporter = getTransporter()

  if (!transporter) {
    console.log('[email:dev]', { to, subject, text })
    return true
  }

  try {
    await transporter.sendMail({ from, to, subject, text, html: html ?? text.replace(/\n/g, '<br>') })
    return true
  } catch (error) {
    console.error('[email:error]', error)
    return false
  }
}

export function buildAttendanceEmail(
  studentName: string,
  className: string,
  status: AttendanceStatus,
  date: string
) {
  const label = status === 'ABSENT' ? 'absent' : 'late'
  const subject = `Attendance Alert: ${studentName} marked ${label}`
  const text = [
    `Dear Guardian,`,
    ``,
    `${studentName} was marked ${label.toUpperCase()} for ${className} on ${date}.`,
    ``,
    `Please log in to the guardian portal for more details.`,
    ``,
    `— Fingerprint Attendance System`,
  ].join('\n')

  return { subject, text }
}
