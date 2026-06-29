'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Fingerprint, Check, X } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PushNotifications from '@/components/PushNotifications'
import { AIAssistant } from '@/components/AIAssistant'

type DayStatus = 'PRESENT' | 'LATE' | 'ABSENT'

interface ClassItem {
  id: string
  name: string
  schedule: string
  teacher: { name: string; email: string; employee_id: string }
}

interface AttendanceData {
  student: { name: string; student_id: string; fingerprint_id: string | null; id: string }
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
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [fingerprintStage, setFingerprintStage] = useState<'idle' | 'place' | 'scanning' | 'success' | 'error'>('idle')
  const [attendanceError, setAttendanceError] = useState('')
  const [markingAttendance, setMarkingAttendance] = useState(false)

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

  const openAttendanceModal = () => {
    setAttendanceModalOpen(true)
    setFingerprintStage('idle')
    setAttendanceError('')
  }

  const runAttendanceSimulation = async () => {
    if (!data?.student.fingerprint_id) {
     setFingerprintStage('error')
      setAttendanceError('Fingerprint not registered. Please contact your admin.')
      return
    }

    setFingerprintStage('place')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setFingerprintStage('scanning')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Mark attendance
    setMarkingAttendance(true)
    try {
      // Get today's class (first enrolled class for simplicity)
      if (classes.length === 0) {
        setAttendanceError('No enrolled classes found.')
        setFingerprintStage('error')
        return
      }

      const today = new Date().toISOString().slice(0, 10)
      const requestBody = {
        classId: classes[0].id,
        date: today,
        status: 'PRESENT',
      }
      console.log('[Attendance Mark] Request body:', requestBody)
      console.log('[Attendance Mark] studentId:', data.student.id)
      console.log('[Attendance Mark] classId:', classes[0].id)

      const res = await fetch('/api/student/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const responseData = await res.json()
      console.log('[Attendance Mark] Response:', responseData)

      if (!res.ok) {
        setAttendanceError(responseData.error || 'Failed to mark attendance')
        setFingerprintStage('error')
        return
      }

      // Success - show verified state
      setFingerprintStage('success')
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAttendanceModalOpen(false)
      loadData() // Refresh data
    } catch (error) {
      console.error('[Attendance Mark] Error:', error)
      setAttendanceError('Failed to mark attendance')
      setFingerprintStage('error')
    } finally {
      setMarkingAttendance(false)
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
            <div className="text-center py-12 text-muted-foreground">Loading attendance...</div>
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

              {/* Mark Attendance Button */}
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Mark Today's Attendance</h3>
                      <p className="text-blue-100 text-sm mt-1">Use your fingerprint to check in</p>
                    </div>
                    <Button
                      onClick={openAttendanceModal}
                      size="lg"
                      className="bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                    >
                      <Fingerprint className="w-5 h-5 mr-2" />
                      Mark Attendance
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <PushNotifications role="STUDENT" />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Class Timetable</CardTitle>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No enrolled classes</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classes.map((c) => (
                        <div key={c.id} className="rounded-lg border border-border px-4 py-4">
                          <p className="font-semibold text-foreground">{c.name}</p>
                          <p className="text-sm text-primary mt-1">{c.schedule}</p>
                          <p className="text-sm text-muted-foreground mt-2">
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
                      <CardTitle className="text-lg font-semibold text-foreground">
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
                        <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
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
                                  ? 'bg-primary/10 border-primary'
                                  : 'border-border'
                            }`}
                            title={
                              status
                                ? `${cell.dateKey}: ${status}`
                                : cell.dateKey
                            }
                          >
                            <span
                              className={`text-sm ${isToday ? 'font-bold text-primary' : 'text-foreground'}`}
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

                    <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
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
                    <CardTitle className="text-lg font-semibold text-foreground">Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { label: 'Present', count: data.stats.present, color: 'text-green-600' },
                        { label: 'Late', count: data.stats.late, color: 'text-yellow-600' },
                        { label: 'Absent', count: data.stats.absent, color: 'text-red-600' },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between items-center">
                          <span className="font-semibold text-foreground">{row.label}</span>
                          <span className={`font-semibold ${row.color}`}>{row.count}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-3 flex justify-between items-center">
                        <span className="font-medium text-foreground">Overall Rate</span>
                        <span className="text-2xl font-bold text-primary">
                          {data.stats.attendancePercentage}%
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground mt-6 mb-3">Recent Records</h3>
                    {data.records.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attendance records yet</p>
                    ) : (
                      <ul className="space-y-2 max-h-48 overflow-y-auto">
                        {data.records.slice(0, 8).map((r) => (
                          <li
                            key={r.id}
                            className="text-sm flex justify-between items-center py-1.5 border-b border-border"
                          >
                            <div>
                              <p className="text-foreground">{r.className}</p>
                              <p className="text-xs text-muted-foreground">{r.date}</p>
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
            <div className="text-center py-12 text-muted-foreground">Failed to load data</div>
          )}
        </div>
      </main>
      <AIAssistant role="STUDENT" />

      {/* Attendance Modal */}
      {attendanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Mark Attendance</h3>
                <p className="text-muted-foreground mt-1">Fingerprint verification</p>
              </div>
              <button onClick={() => setAttendanceModalOpen(false)} className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80">
                ×
              </button>
            </div>

            <div className="flex flex-col items-center py-8">
              {fingerprintStage === 'idle' && (
                <div className="flex flex-col items-center gap-4">
                  <Fingerprint className="w-32 h-32 text-blue-500" />
                  <p className="text-muted-foreground">Click below to start fingerprint scan</p>
                  <button
                    onClick={runAttendanceSimulation}
                    disabled={markingAttendance}
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {markingAttendance ? 'Processing...' : 'Start Scan'}
                  </button>
                </div>
              )}

              {fingerprintStage === 'place' && (
                <div className="flex flex-col items-center gap-4">
                  <Fingerprint className="w-32 h-32 text-blue-500 animate-pulse" />
                  <p className="text-lg font-semibold text-blue-600">Place finger on scanner...</p>
                </div>
              )}

              {fingerprintStage === 'scanning' && (
                <div className="flex flex-col items-center gap-4 relative">
                  <div className="relative">
                    <Fingerprint className="w-32 h-32 text-blue-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-1 bg-blue-400" style={{ animation: 'scan 1.5s linear forwards' }}></div>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">Scanning...</p>
                  <style jsx>{`
                    @keyframes scan {
                      0% { transform: translateY(-64px); }
                      100% { transform: translateY(64px); }
                    }
                  `}</style>
                </div>
              )}

              {fingerprintStage === 'success' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-lg font-semibold text-green-600">Verified!</p>
                  <p className="text-sm text-muted-foreground">Attendance marked successfully</p>
                </div>
              )}

              {fingerprintStage === 'error' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 rounded-full bg-red-500 flex items-center justify-center">
                    <X className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-lg font-semibold text-red-600">Error</p>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">{attendanceError}</p>
                  <button
                    onClick={() => setAttendanceModalOpen(false)}
                    className="mt-2 rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
