import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      student: {
        select: {
          student_id: true,
          fingerprint_id: true,
          guardian_email: true,
        },
      },
      teacher: {
        select: {
          employee_id: true,
        },
      },
    },
  })

  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const body = await request.json()
  const { name, email, password, role, student_id, fingerprint_id, guardian_email, employee_id } = body

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const hashedPassword = await hashPassword(password)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      student:
        role === 'STUDENT'
          ? {
              create: {
                student_id: student_id ?? `STU-${Date.now()}`,
                fingerprint_id: fingerprint_id ?? '',
                guardian_email: guardian_email ?? '',
              },
            }
          : undefined,
      teacher:
        role === 'TEACHER'
          ? {
              create: {
                employee_id: employee_id ?? `EMP-${Date.now()}`,
              },
            }
          : undefined,
    },
  })

  return NextResponse.json({ user }, { status: 201 })
}
