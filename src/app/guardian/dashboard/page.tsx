'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import PushNotifications from '@/components/PushNotifications'

interface ChildData {
  id: string
  student_id: string
  name: string
  stats: {
    present: number
    late: number
    absent: number
    attendancePercentage: number
  }
  recentAlerts: {
    id: string
    date: string
    status: string
    className: string
  }[]
  classes: {
    id: string
    name: string
    schedule: string
    teacherName: string
  }[]
}

interface GuardianDashboardData {
  guardian: { name: string; email: string }
  children: ChildData[]
}

export default function GuardianDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<GuardianDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/guardian/dashboard')
      if (res.status === 401) {
        router.push('/guardian/login')
        return
      }
      setData(await res.json())
    } catch (error) {
      console.error('Failed to load guardian dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = async () => {
    setLogoutLoading(true)
    await fetch('/api/guardian/logout', { method: 'POST' })
    router.push('/guardian/login')
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Guardian Portal</h1>
            {data && (
              <p className="text-sm text-slate-500 mt-1">
                Welcome, {data.guardian.name} ({data.guardian.email})
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-slate-400 transition"
          >
            {logoutLoading ? 'Signing out...' : 'Logout'}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : !data || data.children.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No students linked to your guardian email yet.
          </div>
        ) : (
          <>
            <PushNotifications role="GUARDIAN" />

            {data.children.map((child) => (
              <div key={child.id} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">{child.name}</h2>
                    <p className="text-sm text-slate-500">{child.student_id}</p>
                  </div>
                  {[
                    { label: 'Attendance Rate', value: `${child.stats.attendancePercentage}%` },
                    { label: 'Present', value: child.stats.present },
                    { label: 'Late', value: child.stats.late },
                    { label: 'Absent', value: child.stats.absent },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <p className="text-sm text-slate-500">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Class Timetable</h3>
                    {child.classes.length === 0 ? (
                      <p className="text-sm text-slate-500">No enrolled classes</p>
                    ) : (
                      <ul className="space-y-3">
                        {child.classes.map((c) => (
                          <li
                            key={c.id}
                            className="rounded-lg border border-slate-100 px-4 py-3"
                          >
                            <p className="font-medium text-slate-900">{c.name}</p>
                            <p className="text-sm text-slate-500">{c.schedule}</p>
                            <p className="text-xs text-slate-400 mt-1">Teacher: {c.teacherName}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Alerts</h3>
                    {child.recentAlerts.length === 0 ? (
                      <p className="text-sm text-slate-500">No late or absent records</p>
                    ) : (
                      <ul className="space-y-2">
                        {child.recentAlerts.map((alert) => (
                          <li
                            key={alert.id}
                            className={`flex justify-between items-center rounded-lg px-4 py-3 border ${
                              alert.status === 'ABSENT'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <div>
                              <p className="font-medium text-slate-900">{alert.className}</p>
                              <p className="text-xs text-slate-500">{alert.date}</p>
                            </div>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                alert.status === 'ABSENT'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {alert.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        <p className="text-center text-sm text-slate-500">
          Email and SMS alerts are sent automatically when a teacher marks your child late or absent.
        </p>
      </div>
    </main>
  )
}
