'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PushNotifications from '@/components/PushNotifications'
import { AIAssistant } from '@/components/AIAssistant'

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
  const [userName, setUserName] = useState('')

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/guardian/dashboard')
      if (res.status === 401) {
        router.push('/login?role=GUARDIAN')
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
    router.push('/login?role=GUARDIAN')
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="GUARDIAN" userName={data?.guardian.name} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h1 className="text-2xl font-bold text-foreground">Guardian Portal</h1>
            {data && (
              <p className="text-muted-foreground">
                Welcome, {data.guardian.name} ({data.guardian.email})
              </p>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !data || data.children.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No students linked to your guardian email yet.
            </Card>
          ) : (
            <>
              <PushNotifications role="GUARDIAN" />

              {data.children.map((child) => (
                <div key={child.id} className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground">{child.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{child.student_id}</p>
                    </CardHeader>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{child.stats.attendancePercentage}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{child.stats.present}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{child.stats.late}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">{child.stats.absent}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">Class Timetable</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {child.classes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No enrolled classes</p>
                        ) : (
                          <ul className="space-y-3">
                            {child.classes.map((c) => (
                              <li
                                key={c.id}
                                className="rounded-lg border border-border px-4 py-3"
                              >
                                <p className="font-medium text-foreground">{c.name}</p>
                                <p className="text-sm text-muted-foreground">{c.schedule}</p>
                                <p className="text-xs text-muted-foreground mt-1">Teacher: {c.teacherName}</p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">Recent Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {child.recentAlerts.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No late or absent records</p>
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
                                  <p className="font-medium text-foreground">{alert.className}</p>
                                  <p className="text-xs text-muted-foreground">{alert.date}</p>
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
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Email and SMS alerts are sent automatically when a teacher marks your child late or absent.
          </p>
        </div>
      </main>
      <AIAssistant role="GUARDIAN" />
    </div>
  )
}
