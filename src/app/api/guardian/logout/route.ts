import { NextResponse } from 'next/server'
import { clearGuardianCookie } from '@/lib/guardianAuth'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' })
  clearGuardianCookie(response)
  return response
}
