import type { NextRequest } from 'next/server'
import { authorizeAdmin } from '@/lib/adminAuth'
import { authorizeGuardian } from '@/lib/guardianAuth'
import { authorizeStudent } from '@/lib/studentAuth'
import { authorizeTeacher } from '@/lib/teacherAuth'
import { prisma } from '@/lib/prisma'
import type { ChatAuthContext } from './types'

/**
 * Resolves authenticated chat context from existing auth helpers.
 * Does not modify authentication logic — only reuses authorize* functions.
 */
export async function resolveChatAuth(request: NextRequest): Promise<ChatAuthContext | null> {
  const guardian = await authorizeGuardian(request)
  if (guardian) {
    return {
      role: 'GUARDIAN',
      userId: guardian.userId,
      guardianId: guardian.guardianId,
      email: guardian.guardian.email,
      name: guardian.guardian.name,
    }
  }

  const admin = await authorizeAdmin(request)
  if (admin) {
    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
      select: { name: true },
    })
    return {
      role: 'ADMIN',
      userId: admin.userId,
      email: admin.email,
      name: user?.name ?? 'Admin',
    }
  }

  const teacher = await authorizeTeacher(request)
  if (teacher) {
    const user = await prisma.user.findUnique({
      where: { id: teacher.userId },
      select: { name: true },
    })
    return {
      role: 'TEACHER',
      userId: teacher.userId,
      teacherId: teacher.teacherId,
      name: user?.name ?? 'Teacher',
    }
  }

  const student = await authorizeStudent(request)
  if (student) {
    return {
      role: 'STUDENT',
      userId: student.userId,
      studentId: student.studentId,
      name: student.student.user.name,
    }
  }

  return null
}
