import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const classId = params.id
  const body = await request.json()
  const { name, schedule, teacherId } = body

  const data: any = {}
  if (name) data.name = name
  if (schedule) data.schedule = schedule
  if (teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }
    data.teacherId = teacherId
  }

  const updatedClass = await prisma.class.update({
    where: { id: classId },
    data,
  })

  return NextResponse.json({ class: updatedClass })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const classId = params.id
  await prisma.attendance.deleteMany({ where: { classId } })
  await prisma.enrollment.deleteMany({ where: { classId } })
  await prisma.class.delete({ where: { id: classId } })

  return NextResponse.json({ success: true })
}
