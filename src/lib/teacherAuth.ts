import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { prisma } from './prisma'

export async function authorizeTeacher(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null

  const decoded = await verifyToken(token)
  if (!decoded || decoded.role !== 'TEACHER') return null

  const teacher = await prisma.teacher.findUnique({
    where: { userId: decoded.userId },
  })

  if (!teacher) return null

  return { ...decoded, teacherId: teacher.id }
}

export function teacherUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
