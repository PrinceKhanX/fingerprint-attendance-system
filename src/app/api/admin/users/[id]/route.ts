import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const userId = params.id
  const body = await request.json()
  const { name, email, password, role, student_id, fingerprint_id, guardian_email, employee_id } = body

  const data: any = {}
  if (name) data.name = name
  if (email) data.email = email
  if (password) data.password = await hashPassword(password)

  if (role) data.role = role

  const updateData: any = {
    ...data,
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: {
      student: true,
      teacher: true,
    },
  })

  if (role === 'STUDENT') {
    await prisma.student.upsert({
      where: { userId },
      create: {
        userId,
        student_id: student_id ?? `STU-${Date.now()}`,
        fingerprint_id: fingerprint_id ?? '',
        guardian_email: guardian_email ?? '',
      },
      update: {
        student_id: student_id ?? user.student?.student_id ?? `STU-${Date.now()}`,
        fingerprint_id: fingerprint_id ?? user.student?.fingerprint_id ?? '',
        guardian_email: guardian_email ?? user.student?.guardian_email ?? '',
      },
    })
  }

  if (role === 'TEACHER') {
    await prisma.teacher.upsert({
      where: { userId },
      create: {
        userId,
        employee_id: employee_id ?? `EMP-${Date.now()}`,
      },
      update: {
        employee_id: employee_id ?? user.teacher?.employee_id ?? `EMP-${Date.now()}`,
      },
    })
  }

  return NextResponse.json({ user })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const userId = params.id
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: true,
      teacher: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.student) {
    await prisma.attendance.deleteMany({ where: { studentId: user.student.id } })
    await prisma.enrollment.deleteMany({ where: { studentId: user.student.id } })
    await prisma.student.delete({ where: { id: user.student.id } })
  }

  if (user.teacher) {
    const classes = await prisma.class.findMany({ where: { teacherId: user.teacher.id } })
    for (const klass of classes) {
      await prisma.attendance.deleteMany({ where: { classId: klass.id } })
      await prisma.enrollment.deleteMany({ where: { classId: klass.id } })
      await prisma.class.delete({ where: { id: klass.id } })
    }
    await prisma.teacher.delete({ where: { id: user.teacher.id } })
  }

  await prisma.user.delete({ where: { id: userId } })

  return NextResponse.json({ success: true })
}
