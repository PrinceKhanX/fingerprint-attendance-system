import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { authorizeGuardian } from '@/lib/guardianAuth'
import { authorizeStudent } from '@/lib/studentAuth'
import { getVapidPublicKey } from '@/lib/push'
import { prisma } from '@/lib/prisma'

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { endpoint, keys, role } = body as {
    endpoint: string
    keys: { p256dh: string; auth: string }
    role: 'GUARDIAN' | 'STUDENT'
  }

  if (!endpoint || !keys?.p256dh || !keys?.auth || !role) {
    return NextResponse.json({ error: 'Missing subscription data' }, { status: 400 })
  }

  let email: string | null = null

  if (role === 'GUARDIAN') {
    const guardian = await authorizeGuardian(request)
    if (!guardian) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    email = guardian.guardian.email
  } else if (role === 'STUDENT') {
    const student = await authorizeStudent(request)
    if (!student) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    email = student.student.user.email
  } else {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, role, email },
    update: { p256dh: keys.p256dh, auth: keys.auth, role, email },
  })

  return NextResponse.json({ subscribed: true })
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()
  const { endpoint } = body

  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
  }

  const token =
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('guardian_auth_token')?.value

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  return NextResponse.json({ unsubscribed: true })
}
