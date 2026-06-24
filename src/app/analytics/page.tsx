'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { Moon, Sun } from 'lucide-react'

interface DailyAttendanceData {
  date: string
  rate: number
  present: number
  total: number
}

interface ClassAttendanceData {
  classId: string
  className: string
  attendanceRate: number
  totalStudents: number
  presentCount: number
  totalAttendanceRecords: number
}

interface LowAttendanceStudent {
  studentId: string
  student_id: string
  name: string
  email: string
  attendanceRate: number
  totalAttendance: number
  presentCount: number
  absentCount: number
  classes: string
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [dailyData, setDailyData] = useState<DailyAttendanceData[]>([])
  const [classData, setClassData] = useState<ClassAttendanceData[]>([])
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState<LowAttendanceStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    async function loadData() {
      try {
        const [dailyRes, classRes, lowRes] = await Promise.all([
          fetch('/api/analytics/daily-attendance'),
          fetch('/api/analytics/class-attendance'),
          fetch('/api/analytics/low-attendance'),
        ])

        if (dailyRes.status === 401 || classRes.status === 401 || lowRes.status === 401) {
          router.push('/login')
          return
        }

        const [dailyJson, classJson, lowJson] = await Promise.all([
          dailyRes.json(),
          classRes.json(),
          lowRes.json(),
        ])

        if (!dailyRes.ok) throw new Error(dailyJson.error || 'Failed to load daily attendance')
        if (!classRes.ok) throw new Error(classJson.error || 'Failed to load class attendance')
        if (!lowRes.ok) throw new Error(lowJson.error || 'Failed to load low attendance students')

        setDailyData(dailyJson.data || [])
        setClassData(classJson.data || [])
        setLowAttendanceStudents(lowJson.data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading analytics...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Attendance Analytics</h1>
            <p className="text-slate-600">View attendance trends and insights</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Daily Attendance Rate Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Daily Attendance Rate (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Attendance Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Attendance Comparison Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Attendance Rate by Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Attendance Rate']} />
                  <Legend />
                  <Bar dataKey="attendanceRate" fill="#10b981" name="Attendance Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low Attendance Students Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Students with Low Attendance (&lt;75%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowAttendanceStudents.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No students with low attendance found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Student ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Classes</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Attendance Rate</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Present</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Absent</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowAttendanceStudents.map((student) => (
                      <tr key={student.studentId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-600">{student.student_id}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">{student.name}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{student.email}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{student.classes}</td>
                        <td className="py-3 px-4 text-sm text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.attendanceRate < 50
                                ? 'bg-red-100 text-red-800'
                                : student.attendanceRate < 65
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {student.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-right text-green-600">{student.presentCount}</td>
                        <td className="py-3 px-4 text-sm text-right text-red-600">{student.absentCount}</td>
                        <td className="py-3 px-4 text-sm text-right text-slate-600">{student.totalAttendance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
