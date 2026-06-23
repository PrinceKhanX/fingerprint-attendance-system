import { NextRequest, NextResponse } from 'next/server'
import { aggregateDayStatus, attendancePercentage } from '@/lib/schedule'
import { authorizeGuardian, guardianUnauthorized } from '@/lib/guardianAuth'
import { prisma } from '@/lib/prisma'

function dateKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function GET(request: NextRequest) {
  const auth = await authorizeGuardian(request)
  if (!auth) return guardianUnauthorized()

  const students = await prisma.student.findMany({
    where: { guardian_email: auth.guardian.email },
    include: {
      user: { select: { name: true, email: true } },
      attendance: {
        include: { class: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
        take: 30,
      },
      enrollments: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              schedule: true,
              teacher: {
                select: {
                  user: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  const month = request.nextUrl.searchParams.get('month')
  const now = new Date()
  const monthStr =
    month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const children = students.map((student) => {
    const allRecords = student.attendance
    let present = 0
    let late = 0
    let absent = 0

    for (const r of allRecords) {
      if (r.status === 'PRESENT') present++
      else if (r.status === 'LATE') late++
      else absent++
    }

    const byDate: Record<string, string[]> = {}
    for (const r of allRecords) {
      const key = dateKey(r.timestamp)
      if (!byDate[key]) byDate[key] = []
      byDate[key].push(r.status)
    }

    const calendar: Record<string, string> = {}
    for (const [day, statuses] of Object.entries(byDate)) {
      const aggregated = aggregateDayStatus(statuses)
      if (aggregated) calendar[day] = aggregated
    }

    return {
      id: student.id,
      student_id: student.student_id,
      name: student.user.name,
      stats: {
        present,
        late,
        absent,
        attendancePercentage: attendancePercentage(present, late, absent),
      },
      calendar,
      recentAlerts: allRecords
        .filter((r) => r.status === 'LATE' || r.status === 'ABSENT')
        .slice(0, 5)
        .map((r) => ({
          id: r.id,
          date: dateKey(r.timestamp),
          status: r.status,
          className: r.class.name,
        })),
      classes: student.enrollments.map((e) => ({
        id: e.class.id,
        name: e.class.name,
        schedule: e.class.schedule,
        teacherName: e.class.teacher.user.name,
      })),
    }
  })

  return NextResponse.json({
    guardian: {
      name: auth.guardian.name,
      email: auth.guardian.email,
    },
    month: monthStr,
    children,
  })
}
