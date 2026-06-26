import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Try auth_token first (for admin, teacher, student)
  let token = request.cookies.get('auth_token')?.value
  
  // If not found, try guardian_auth_token
  if (!token) {
    token = request.cookies.get('guardian_auth_token')?.value
  }

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  return NextResponse.json({
    userId: decoded.userId,
    role: decoded.role,
  })
}
