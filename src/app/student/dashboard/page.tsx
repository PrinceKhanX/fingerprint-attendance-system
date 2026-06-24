'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PushNotifications from '@/components/PushNotifications'

type DayStatus = 'PRESENT' | 'LATE' | 'ABSENT'

interface ClassItem {
  id: string
  name: string
  schedule: string
  teacher: { name: string; email: string; employee_id: string }
}

interface AttendanceData {
  student: { name: string; student_id: string }
  month: string
  stats: {
    enrolledClasses: number
    present: number
    late: number
    absent: number
    totalRecords: number
    attendancePercentage: number
  }
  calendar: Record<string, DayStatus>
  records: {
    id: string
    date: string
    status: DayStatus
    className: string
    marked_by: string
  }[]
}

const STATUS_COLORS: Record<DayStatus, string> = {
  PRESENT: 'bg-green-500',
  LATE: 'bg-yellow-400',
  ABSENT: 'bg-red-500',
}

const STATUS_BG: Record<DayStatus, string> = {
  PRESENT: 'bg-green-50 border-green-200',
  LATE: 'bg-yellow-50 border-yellow-200',
  ABSENT: 'bg-red-50 border-red-200',
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(monthStr: string, delta: number) {
  const [year, month] = monthStr.split('-').map(Number)
  const d = new Date(year, month - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function StudentDashboard() {
  const router = useRouter()
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState<AttendanceData | null>(null)
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [userName, setUserName] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [attRes, classRes] = await Promise.all([
        fetch(`/api/student/attendance?month=${month}`),
        fetch('/api/student/classes'),
      ])
      if (attRes.status === 401) {
        router.push('/login')
        return
      }
      const json = await attRes.json()
      setData(json)
      if (classRes.ok) {
        const classJson = await classRes.json()
        setClasses(classJson.classes ?? [])
      }
    } catch (error) {
      console.error('Failed to load attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [month, router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const calendarGrid = useMemo(() => {
    const [year, monthNum] = month.split('-').map(Number)
    const firstDay = new Date(year, monthNum - 1, 1).getDay()
    const daysInMonth = new Date(year, monthNum, 0).getDate()

    const cells: { day: number | null; dateKey: string | null }[] = []
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateKey: null })
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({ day: d, dateKey })
    }
    return cells
  }, [month])

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const [year, monthNum] = month.split('-').map(Number)

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="STUDENT" userName={data?.student.name} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
            {data && (
              <p className="text-muted-foreground">
                {data.student.name} · {data.student.student_id}
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading attendance...</div>
          ) : data ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{data.stats.enrolledClasses}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{data.stats.attendancePercentage}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Days Absent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{data.stats.absent}</div>
                  </CardContent>
                </Card>
              </div>

              <PushNotifications role="STUDENT" />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Class Timetable</CardTitle>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <p className="text-sm text-slate-500">No enrolled classes</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classes.map((c) => (
                        <div key={c.id} className="rounded-lg border border-slate-100 px-4 py-4">
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          <p className="text-sm text-indigo-600 mt-1">{c.schedule}</p>
                          <p className="text-sm text-slate-500 mt-2">
                            Teacher: {c.teacher.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        {MONTH_NAMES[monthNum - 1]} {year}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, -1))}>
                          ← Prev
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setMonth(currentMonth())}>
                          Today
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setMonth((m) => shiftMonth(m, 1))}>
                          Next →
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {WEEKDAYS.map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-slate-500 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarGrid.map((cell, i) => {
                        if (!cell.day || !cell.dateKey) {
                          return <div key={`empty-${i}`} className="aspect-square" />
                        }

                        const status = data.calendar[cell.dateKey]
                        const isToday = cell.dateKey === new Date().toISOString().slice(0, 10)

                        return (
                          <div
                            key={cell.dateKey}
                            className={`aspect-square rounded-lg border flex flex-col items-center justify-center relative ${
                              status
                                ? STATUS_BG[status]
                                : isToday
                                  ? 'bg-blue-50 border-blue-200'
                                  : 'border-slate-100'
                            }`}
                            title={
                              status
                                ? `${cell.dateKey}: ${status}`
                                : cell.dateKey
                            }
                          >
                            <span
                              className={`text-sm ${isToday ? 'font-bold text-blue-700' : 'text-slate-700'}`}
                            >
                              {cell.day}
                            </span>
                            {status && (
                              <span
                                className={`w-2.5 h-2.5 rounded-full mt-0.5 ${STATUS_COLORS[status]}`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex gap-4 mt-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-green-500" /> Present
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-yellow-400" /> Late
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500" /> Absent
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: 'Present', count: data.stats.present, color: 'text-green-600' },
                        { label: 'Late', count: data.stats.late, color: 'text-yellow-600' },
                        { label: 'Absent', count: data.stats.absent, color: 'text-red-600' },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span className="text-slate-600">{row.label}</span>
                          <span className={`font-semibold ${row.color}`}>{row.count}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                        <span className="font-medium text-slate-900">Overall Rate</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {data.stats.attendancePercentage}%
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mt-6 mb-3">Recent Records</h3>
                    {data.records.length === 0 ? (
                      <p className="text-sm text-slate-500">No attendance records yet</p>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {data.records.slice(0, 8).map((r) => (
                          <li
                            key={r.id}
                            className="text-sm flex justify-between items-center py-1.5 border-b border-slate-50"
                          >
                            <div>
                              <p className="text-slate-900">{r.className}</p>
                              <p className="text-xs text-slate-500">{r.date}</p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                r.status === 'PRESENT'
                                  ? 'bg-green-100 text-green-700'
                                  : r.status === 'LATE'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">Failed to load data</div>
          )}
        </div>
      </main>
    </div>
  )
}
