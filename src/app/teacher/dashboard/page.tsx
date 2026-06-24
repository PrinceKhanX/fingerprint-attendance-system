'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

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
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">
              {dashboard?.date ?? todayString()} · Live attendance
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/teacher/attendance"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Manual Attendance
            </Link>
            <Link
              href="/analytics"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
            >
              Analytics
            </Link>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-slate-400 transition"
            >
              {logoutLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Today's Classes",
                  value: dashboard?.summary.classCount ?? 0,
                  icon: '📚',
                },
                {
                  title: 'Students Present',
                  value: `${dashboard?.summary.totalPresent ?? 0} / ${dashboard?.summary.totalStudents ?? 0}`,
                  icon: '✓',
                },
                {
                  title: 'Attendance Rate',
                  value: `${dashboard?.summary.attendanceRate ?? 0}%`,
                  icon: '📊',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="text-4xl mb-3">{card.icon}</div>
                  <p className="text-slate-600 text-sm">{card.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                </div>
              ))}
            </div>

            {dashboard?.showingAllClasses && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
                No classes scheduled today — showing all your classes.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {dashboard?.showingAllClasses ? 'Your Classes' : "Today's Classes"}
                  </h2>
                </div>
                <ul className="divide-y divide-slate-100">
                  {dashboard?.classes.length === 0 ? (
                    <li className="px-6 py-8 text-center text-slate-500">
                      No classes assigned
                    </li>
                  ) : (
                    dashboard?.classes.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => setSelectedClassId(c.id)}
                          className={`w-full text-left px-6 py-4 hover:bg-slate-50 transition ${
                            selectedClassId === c.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-slate-900">{c.name}</p>
                              <p className="text-sm text-slate-500 mt-1">{c.schedule}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                {c.presentToday}/{c.totalEnrolled}
                              </p>
                              <p className="text-xs text-slate-500">present</p>
                            </div>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Present Today
                      {selectedClass ? ` — ${selectedClass.name}` : ''}
                    </h2>
                    {lastUpdated && (
                      <p className="text-xs text-slate-400 mt-1">
                        Updated {lastUpdated.toLocaleTimeString()} · refreshes every 5s
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>

                {!selectedClassId ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    Select a class to view present students
                  </div>
                ) : presentStudents.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    No students marked present yet
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                    {presentStudents.map((student) => (
                      <li
                        key={student.id}
                        className="px-6 py-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-slate-900">{student.name}</p>
                          <p className="text-sm text-slate-500">
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
                  <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
                    {presentStudents.length} of {selectedClass.totalEnrolled} enrolled students
                    present
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
