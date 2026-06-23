import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { prisma } from './prisma'

export async function authorizeGuardian(request: NextRequest) {
  const token = request.cookies.get('guardian_auth_token')?.value
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded || decoded.role !== 'GUARDIAN') return null

  const guardian = await prisma.guardian.findUnique({
    where: { id: decoded.userId },
  })

  if (!guardian) return null

  return { ...decoded, guardianId: guardian.id, guardian }
}

export function guardianUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function setGuardianCookie(response: NextResponse, token: string) {
  response.cookies.set('guardian_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export function clearGuardianCookie(response: NextResponse) {
  response.cookies.delete('guardian_auth_token')
}
