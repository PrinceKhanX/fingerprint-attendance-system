import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export async function authorizeAdmin(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded || decoded.role !== 'ADMIN') return null

  return decoded
}

export function adminUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
