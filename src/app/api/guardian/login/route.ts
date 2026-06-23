import { NextRequest, NextResponse } from 'next/server'
import { generateToken, verifyPassword } from '@/lib/auth'
import { setGuardianCookie } from '@/lib/guardianAuth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const guardian = await prisma.guardian.findUnique({ where: { email } })
  if (!guardian) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await verifyPassword(password, guardian.password)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = await generateToken(guardian.id, guardian.email, 'GUARDIAN')
  const response = NextResponse.json({
    guardian: { id: guardian.id, email: guardian.email, name: guardian.name },
  })
  setGuardianCookie(response, token)
  return response
}
