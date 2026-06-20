import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  const body = await request.json()
  const { studentId, email, fingerprint_id } = body

  if (!fingerprint_id || (!studentId && !email)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let student
  if (studentId) {
    student = await prisma.student.findUnique({ where: { id: studentId } })
  } else {
    student = await prisma.student.findFirst({ where: { user: { email } } })
  }

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const updatedStudent = await prisma.student.update({
    where: { id: student.id },
    data: {
      fingerprint_id,
    },
  })

  return NextResponse.json({ student: updatedStudent })
}
