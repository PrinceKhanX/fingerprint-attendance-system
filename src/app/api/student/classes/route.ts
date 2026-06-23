import { NextRequest, NextResponse } from 'next/server'
import { authorizeStudent, studentUnauthorized } from '@/lib/studentAuth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const auth = await authorizeStudent(request)
  if (!auth) return studentUnauthorized()

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: auth.studentId },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          schedule: true,
          teacher: {
            select: {
              employee_id: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
    orderBy: { class: { name: 'asc' } },
  })

  const classes = enrollments.map((e) => ({
    id: e.class.id,
    name: e.class.name,
    schedule: e.class.schedule,
    teacher: {
      name: e.class.teacher.user.name,
      email: e.class.teacher.user.email,
      employee_id: e.class.teacher.employee_id,
    },
  }))

  return NextResponse.json({ classes })
}
