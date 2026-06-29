import nodemailer from 'nodemailer'
import type { AttendanceStatus } from '@prisma/client'

// .env validation on module load
if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
  console.warn('[email:warning] SMTP configuration incomplete. Email notifications will not work.')
  console.warn('[email:warning] Required: SMTP_HOST, SMTP_USER, SMTP_PASS')
}

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
  html?: string,
  context?: { studentName?: string; guardianEmail?: string }
): Promise<boolean> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@attendance.local'
  const transporter = getTransporter()

  if (!transporter) {
    console.log('[email:dev]', { to, subject, text })
    return true
  }

  try {
    await transporter.sendMail({ from, to, subject, text, html: html ?? text.replace(/\n/g, '<br>') })
    console.log('[email:success]', { to, subject })
    return true
  } catch (error) {
    console.error('[email:failed]', {
      to,
      subject,
      studentName: context?.studentName,
      guardianEmail: context?.guardianEmail,
      error: error instanceof Error ? error.message : String(error)
    })
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

  const statusColor = status === 'ABSENT' ? '#dc2626' : '#f97316'
  const statusBg = status === 'ABSENT' ? '#fef2f2' : '#fff7ed'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">Fingerprint Attendance System</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear Guardian,</p>
        
        <div style="background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #374151; font-size: 15px;">
            <strong>${studentName}</strong> was marked <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase;">${label}</span> for <strong>${className}</strong> on <strong>${date}</strong>.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/guardian/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Details</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This is an automated message. Do not reply.
        </p>
      </div>
    </div>
  `

  return { subject, text, html }
}

export function buildStreakWarningEmail(
  studentName: string,
  absentCount: number
) {
  const subject = `Attendance Warning: ${studentName} has been absent ${absentCount} times recently`
  const text = [
    `Dear Guardian,`,
    ``,
    `${studentName} has been marked ABSENT ${absentCount} times in the last 14 days.`,
    ``,
    `This pattern of absences is concerning. Please contact the school administration to discuss this matter.`,
    ``,
    `Log in to the guardian portal to view detailed attendance records.`,
    ``,
    `— Fingerprint Attendance System`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">⚠️ Attendance Warning</h1>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear Guardian,</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #374151; font-size: 15px;">
            <strong>${studentName}</strong> has been marked <span style="color: #dc2626; font-weight: bold; text-transform: uppercase;">ABSENT</span> <strong>${absentCount} times</strong> in the last 14 days.
          </p>
        </div>
        
        <p style="color: #374151; font-size: 15px; margin: 20px 0; line-height: 1.6;">
          This pattern of absences is concerning. Please contact the school administration to discuss this matter.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/guardian/dashboard" style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">View Attendance Records</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          This is an automated message. Do not reply.
        </p>
      </div>
    </div>
  `

  return { subject, text, html }
}
