'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAssistant } from '@/components/AIAssistant'
import { Clock, Users, AlertTriangle, TrendingUp, Calendar, FileText, Activity, CheckCircle, XCircle } from 'lucide-react'

interface TodayClass {
  id: string
  name: string
  schedule: string
  isScheduledToday: boolean
  totalEnrolled: number
  presentToday: number
  lateToday: number
  attendanceRate: number
}

interface RecentActivity {
  studentId: string
  studentName: string
  studentEmail: string
  status: string
  timestamp: string
  markedBy: string
}

interface Absentee {
  studentId: string
  studentName: string
  studentEmail: string
  className: string
  classId: string
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
    studentsAtRisk: number
  }
  teacherName: string
  recentActivity: RecentActivity[]
  absenteesNeedingFollowUp: Absentee[]
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getAttendanceColor(rate: number) {
  if (rate >= 75) return { stroke: '#22c55e', bg: 'bg-green-100', text: 'text-green-700' }
  if (rate >= 50) return { stroke: '#f97316', bg: 'bg-orange-100', text: 'text-orange-700' }
  return { stroke: '#ef4444', bg: 'bg-red-100', text: 'text-red-700' }
}

function CircularProgress({ value, size = 80, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const color = getAttendanceColor(value)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className={`absolute text-sm font-bold ${color.text}`}>{value}%</span>
    </div>
  )
}

export default function TeacherDashboard() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
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

  useEffect(() => {
    loadDashboard().then((data) => {
      if (data?.teacherName) {
        setUserName(data.teacherName)
      }
    })
  }, [loadDashboard])

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="TEACHER" userName={userName} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground">
              {userName ? `Welcome, ${userName} · ` : ''}{dashboard?.date ?? todayString()} · Live attendance
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
          ) : (
            <>
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Today's Classes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">{dashboard?.summary.classCount ?? 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Present Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-foreground">
                      {dashboard?.summary.totalPresent ?? 0} / {dashboard?.summary.totalStudents ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Attendance Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center gap-4">
                    <CircularProgress value={dashboard?.summary.attendanceRate ?? 0} size={60} strokeWidth={6} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Students at Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{dashboard?.summary.studentsAtRisk ?? 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">&lt;75% attendance</p>
                  </CardContent>
                </Card>
              </div>

              {dashboard?.showingAllClasses && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-amber-800 dark:text-amber-200 text-sm">
                  No classes scheduled today — showing all your classes.
                </div>
              )}

              {/* Main Area: Live Feed */}
              <div className="space-y-6">
                {/* Today's Classes Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {dashboard?.showingAllClasses ? 'Your Classes' : "Today's Classes"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      {dashboard?.classes.length === 0 ? (
                        <div className="px-6 py-8 text-center text-muted-foreground">
                          No classes assigned
                        </div>
                      ) : (
                        dashboard?.classes.map((c, index) => (
                          <div
                            key={c.id}
                            className={`px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition ${
                              index === 0 ? 'border-t-0' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                    {index !== (dashboard?.classes.length ?? 1) - 1 && (
                                      <div className="w-0.5 h-12 bg-border mt-2" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-foreground">{c.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                      <Clock className="h-3 w-3" />
                                      {c.schedule}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <CircularProgress value={c.attendanceRate} size={50} strokeWidth={5} />
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600">
                                    {c.presentToday}/{c.totalEnrolled}
                                  </p>
                                  <p className="text-xs text-muted-foreground">present</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0 max-h-96 overflow-y-auto">
                      {dashboard?.recentActivity.length === 0 ? (
                        <div className="px-6 py-8 text-center text-muted-foreground">
                          No recent activity
                        </div>
                      ) : (
                        dashboard?.recentActivity.map((activity, index) => (
                          <div
                            key={`${activity.studentId}-${index}`}
                            className="px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {activity.status === 'PRESENT' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                ) : activity.status === 'LATE' ? (
                                  <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-foreground truncate">{activity.studentName}</p>
                                  <p className="text-xs text-muted-foreground truncate">{activity.studentEmail}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  activity.status === 'PRESENT' ? 'bg-green-100 text-green-700' :
                                  activity.status === 'LATE' ? 'bg-orange-100 text-orange-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {activity.status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(activity.timestamp)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {activity.markedBy === 'SENSOR' ? 'Sensor' : 'Manual' }
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Absentees Needing Follow-up */}
                {dashboard?.absenteesNeedingFollowUp && dashboard.absenteesNeedingFollowUp.length > 0 && (
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Absentees Needing Follow-up
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="space-y-0 max-h-64 overflow-y-auto">
                        {dashboard.absenteesNeedingFollowUp.map((absentee) => (
                          <div
                            key={absentee.studentId}
                            className="px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">{absentee.studentName}</p>
                                <p className="text-xs text-muted-foreground truncate">{absentee.studentEmail}</p>
                                <p className="text-xs text-muted-foreground">{absentee.className}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/teacher/attendance?classId=${absentee.classId}`)}
                              >
                                Mark Attendance
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <AIAssistant role="TEACHER" />
    </div>
  )
}
