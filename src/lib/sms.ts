import type { AttendanceStatus } from '@prisma/client'

export async function sendSms(to: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !from) {
    console.log('[sms:dev]', { to, message })
    return true
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const body = new URLSearchParams({ To: to, From: from, Body: message })
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!res.ok) {
      console.error('[sms:error]', await res.text())
      return false
    }

    return true
  } catch (error) {
    console.error('[sms:error]', error)
    return false
  }
}

export function buildAttendanceSms(
  studentName: string,
  className: string,
  status: AttendanceStatus,
  date: string
) {
  const label = status === 'ABSENT' ? 'ABSENT' : 'LATE'
  return `Attendance Alert: ${studentName} was marked ${label} for ${className} on ${date}.`
}
