import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const classes = await prisma.class.findMany({
    include: {
      teacher: {
        select: {
          id: true,
          employee_id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ classes })
}

export async function POST(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const body = await request.json()
  const { name, schedule, teacherId } = body

  if (!name || !schedule || !teacherId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } })
  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
  }

  const createdClass = await prisma.class.create({
    data: {
      name,
      schedule,
      teacherId,
    },
  })

  return NextResponse.json({ class: createdClass }, { status: 201 })
}
