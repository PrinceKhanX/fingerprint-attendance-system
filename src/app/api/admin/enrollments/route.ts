import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const enrollments = await prisma.enrollment.findMany({
    include: {
      student: {
        select: {
          id: true,
          student_id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      class: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  return NextResponse.json({ enrollments })
}

export async function POST(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const body = await request.json()
  const { studentId, classId } = body

  if (!studentId || !classId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      classId,
    },
  })

  return NextResponse.json({ enrollment }, { status: 201 })
}
