import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all attendance records for the last 30 days
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        timestamp: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        student: true,
      },
    })

    // Group by date and calculate attendance rate
    const dailyStats = new Map<string, { present: number; total: number }>()

    // Get total number of students
    const totalStudents = await prisma.student.count()

    // Initialize all days with 0
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyStats.set(dateStr, { present: 0, total: totalStudents })
    }

    // Count present students per day
    attendanceRecords.forEach((record) => {
      const dateStr = record.timestamp.toISOString().split('T')[0]
      if (dailyStats.has(dateStr)) {
        const stats = dailyStats.get(dateStr)!
        if (record.status === 'PRESENT' || record.status === 'LATE') {
          stats.present++
        }
      }
    })

    // Convert to array and calculate rates
    const data = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      rate: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      present: stats.present,
      total: stats.total,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching daily attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch daily attendance data' }, { status: 500 })
  }
}
