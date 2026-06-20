import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdmin, adminUnauthorized } from '@/lib/adminAuth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await authorizeAdmin(request)
  if (!admin) return adminUnauthorized()

  await prisma.enrollment.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
