import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { prisma } from './prisma'

export async function authorizeStudent(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded || decoded.role !== 'STUDENT') return null

  const student = await prisma.student.findUnique({
    where: { userId: decoded.userId },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!student) return null

  return { ...decoded, studentId: student.id, student }
}

export function studentUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
