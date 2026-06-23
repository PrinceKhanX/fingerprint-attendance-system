import { NextRequest, NextResponse } from 'next/server'
import { authorizeTeacher, teacherUnauthorized } from '@/lib/teacherAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const teacher = await authorizeTeacher(request)
  if (!teacher) return teacherUnauthorized()

  const classes = await prisma.class.findMany({
    where: { teacherId: teacher.teacherId },
    select: {
      id: true,
      name: true,
      schedule: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ classes })
}
