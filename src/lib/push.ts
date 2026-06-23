import webpush from 'web-push'
import { prisma } from './prisma'

let configured = false

function ensureConfigured() {
  if (configured) return !!process.env.VAPID_PUBLIC_KEY

  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

  if (!publicKey || !privateKey) return false

  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY ?? ''
}

export async function sendPushToEmail(
  email: string,
  role: 'GUARDIAN' | 'STUDENT',
  payload: { title: string; body: string; url?: string }
) {
  if (!ensureConfigured()) {
    console.log('[push:dev]', { email, role, ...payload })
    return { sent: 0, failed: 0 }
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { email, role },
  })

  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      )
      sent++
    } catch (error: unknown) {
      failed++
      const statusCode = (error as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } })
      }
      console.error('[push:error]', error)
    }
  }

  return { sent, failed }
}
