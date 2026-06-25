'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAssistant } from '@/components/AIAssistant'

interface TodayClass {
  id: string
  name: string
  schedule: string
  isScheduledToday: boolean
  totalEnrolled: number
  presentToday: number
}

interface PresentStudent {
  id: string
  student_id: string
  name: string
  email: string
  status: string
  marked_by: string | null
}

interface DashboardData {
  date: string
  classes: TodayClass[]
  showingAllClasses: boolean
  summary: {
    classCount: number
    totalStudents: number
    totalPresent: number
    attendanceRate: number
  }
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [presentStudents, setPresentStudents] = useState<PresentStudent[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [userName, setUserName] = useState('')

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/dashboard')
      if (res.status === 401) {
        router.push('/login')
        return null
      }
      const data = await res.json()
      setDashboard(data)
      return data as DashboardData
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [router])

  const loadPresentStudents = useCallback(async () => {
    if (!selectedClassId) return

    try {
      const date = todayString()
      const res = await fetch(
        `/api/teacher/attendance?classId=${selectedClassId}&date=${date}`
      )
      if (!res.ok) return

      const data = await res.json()
      const present = (data.students ?? []).filter(
        (s: PresentStudent) => s.status === 'PRESENT'
      )
      setPresentStudents(present)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load present students:', error)
    }
  }, [selectedClassId])

  useEffect(() => {
    loadDashboard().then((data) => {
      if (data?.classes?.length) {
        setSelectedClassId((prev) => prev || data.classes[0].id)
      }
    })
  }, [loadDashboard])

  useEffect(() => {
    loadPresentStudents()
    const interval = setInterval(loadPresentStudents, 5000)
    return () => clearInterval(interval)
  }, [loadPresentStudents])

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const selectedClass = dashboard?.classes.find((c) => c.id === selectedClassId)

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="TEACHER" userName={userName} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              {dashboard?.date ?? todayString()} · Live attendance
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Today's Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{dashboard?.summary.classCount ?? 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Students Present</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {dashboard?.summary.totalPresent ?? 0} / {dashboard?.summary.totalStudents ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{dashboard?.summary.attendanceRate ?? 0}%</div>
                  </CardContent>
                </Card>
              </div>

              {dashboard?.showingAllClasses && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
                  No classes scheduled today — showing all your classes.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      {dashboard?.showingAllClasses ? 'Your Classes' : "Today's Classes"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                      {dashboard?.classes.length === 0 ? (
                        <li className="px-6 py-8 text-center text-muted-foreground">
                          No classes assigned
                        </li>
                      ) : (
                        dashboard?.classes.map((c) => (
                          <li key={c.id}>
                            <button
                              onClick={() => setSelectedClassId(c.id)}
                              className={`w-full text-left px-6 py-4 hover:bg-muted/50 transition ${
                                selectedClassId === c.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-foreground">{c.name}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{c.schedule}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    {c.presentToday}/{c.totalEnrolled}
                                  </p>
                                  <p className="text-xs text-muted-foreground">present</p>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Present Today
                        {selectedClass ? ` — ${selectedClass.name}` : ''}
                      </CardTitle>
                      {lastUpdated && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {lastUpdated.toLocaleTimeString()} · refreshes every 5s
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  </CardHeader>
                  <CardContent className="p-0">
                    {!selectedClassId ? (
                      <div className="px-6 py-12 text-center text-muted-foreground">
                        Select a class to view present students
                      </div>
                    ) : presentStudents.length === 0 ? (
                      <div className="px-6 py-12 text-center text-muted-foreground">
                        No students marked present yet
                      </div>
                    ) : (
                      <ul className="divide-y divide-border max-h-96 overflow-y-auto">
                        {presentStudents.map((student) => (
                          <li
                            key={student.id}
                            className="px-6 py-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-foreground">{student.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {student.student_id} · {student.email}
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              {student.marked_by === 'SENSOR' ? 'Sensor' : 'Manual'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {selectedClass && (
                      <div className="px-6 py-3 border-t border-border bg-muted text-sm text-muted-foreground">
                        {presentStudents.length} of {selectedClass.totalEnrolled} enrolled students
                        present
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
      <AIAssistant role="TEACHER" />
    </div>
  )
}
