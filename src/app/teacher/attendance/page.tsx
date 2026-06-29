'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT'

interface ClassOption {
  id: string
  name: string
  schedule: string
  _count: { enrollments: number }
}

interface StudentRow {
  id: string
  student_id: string
  name: string
  email: string
  status: AttendanceStatus | null
}

const statusOptions: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: 'PRESENT', label: 'Present', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'LATE', label: 'Late', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'ABSENT', label: 'Absent', color: 'bg-red-100 text-red-800 border-red-300' },
]

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function TeacherAttendancePage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayString())
  const [students, setStudents] = useState<StudentRow[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [userName, setUserName] = useState('')

  // Socket connection for real-time updates
  useSocket(selectedClassId, (event) => {
    // Only update if the event is for the current class and today's date
    if (event.classId === selectedClassId && event.timestamp.startsWith(selectedDate)) {
      setStudents((prevStudents) => {
        const studentIndex = prevStudents.findIndex((s) => s.id === event.studentId)
        if (studentIndex !== -1) {
          const updated = [...prevStudents]
          updated[studentIndex] = {
            ...updated[studentIndex],
            status: event.status as AttendanceStatus,
          }
          setStatusMap((prev) => ({ ...prev, [event.studentId]: event.status as AttendanceStatus }))
          return updated
        }
        return prevStudents
      })
      setSuccess(`${event.studentName} marked as ${event.status} via fingerprint`)
      setTimeout(() => setSuccess(''), 3000)
    }
  })

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/teacher/classes')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        setClasses(data.classes ?? [])
        if (data.classes?.length === 1) {
          setSelectedClassId(data.classes[0].id)
        }
        // Set teacher name if available
        if (data.teacherName) {
          setUserName(data.teacherName)
        }
      } catch {
        setError('Failed to load classes')
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [router])

  const loadStudents = useCallback(async () => {
    if (!selectedClassId || !selectedDate) return

    setLoadingStudents(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(
        `/api/teacher/attendance?classId=${selectedClassId}&date=${selectedDate}`
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load students')
        setStudents([])
        return
      }

      setStudents(data.students ?? [])
      const initial: Record<string, AttendanceStatus> = {}
      for (const s of data.students ?? []) {
        if (s.status) initial[s.id] = s.status
      }
      setStatusMap(initial)
    } catch {
      setError('Failed to load students')
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedClassId, selectedDate])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }))
    setSuccess('')
  }

  const markAll = (status: AttendanceStatus) => {
    const next: Record<string, AttendanceStatus> = {}
    for (const s of students) next[s.id] = status
    setStatusMap(next)
    setSuccess('')
  }

  const handleSave = async () => {
    const records = students
      .filter((s) => statusMap[s.id])
      .map((s) => ({ studentId: s.id, status: statusMap[s.id] }))

    if (records.length === 0) {
      setError('Mark at least one student before saving')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId, date: selectedDate, records }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save attendance')
        return
      }

      setSuccess(`Saved attendance for ${data.saved} student(s)`)
      // Refetch attendance data without triggering state changes that affect socket
      const attendanceRes = await fetch(
        `/api/teacher/attendance?classId=${selectedClassId}&date=${selectedDate}`
      )
      const attendanceData = await attendanceRes.json()
      if (attendanceRes.ok) {
        setStudents(attendanceData.students ?? [])
        const initial: Record<string, AttendanceStatus> = {}
        for (const s of attendanceData.students ?? []) {
          if (s.status) initial[s.id] = s.status
        }
        setStatusMap(initial)
      }
    } catch {
      setError('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const markedCount = Object.keys(statusMap).length

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manual Attendance</h1>
            <p className="text-sm text-slate-500 mt-1">
              {userName ? `Welcome, ${userName} · ` : ''}Mark students present, late, or absent
            </p>
          </div>
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c._count.enrollments} students)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-600 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 text-sm">
            {success}
          </div>
        )}

        {selectedClassId && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Students</h2>
                <p className="text-sm text-slate-500">
                  {markedCount} of {students.length} marked
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => markAll(opt.value)}
                    disabled={students.length === 0}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border-2 shadow-md hover:shadow-lg transition disabled:opacity-50 ${
                      opt.value === 'PRESENT'
                        ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                        : opt.value === 'LATE'
                        ? 'bg-yellow-500 text-white border-yellow-600 hover:bg-yellow-600'
                        : 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                    }`}
                  >
                    Mark all {opt.label.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {loadingStudents ? (
              <div className="px-6 py-12 text-center text-slate-500">Loading students...</div>
            ) : students.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                No students enrolled in this class
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {students.map((student) => (
                  <li
                    key={student.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{student.name}</p>
                      <p className="text-sm text-slate-500">
                        {student.student_id} · {student.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {statusOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setStatus(student.id, opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                            statusMap[student.id] === opt.value
                              ? opt.color
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400 transition"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
