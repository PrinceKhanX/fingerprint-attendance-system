'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Fingerprint, Check } from 'lucide-react'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIAssistant } from '@/components/AIAssistant'

interface UserRecord {
  id: string
  name: string
  email: string
  role: string
  student?: {
    id: string
    student_id: string
    fingerprint_id: string
    guardian_email: string
  }
  teacher?: {
    id: string
    employee_id: string
  }
}

interface ClassRecord {
  id: string
  name: string
  schedule: string
  teacher: {
    id: string
    employee_id: string
    user: {
      name: string
      email: string
    }
  }
}

interface EnrollmentRecord {
  id: string
  student: {
    id: string
    student_id: string
    user: {
      name: string
      email: string
    }
  }
  class: {
    id: string
    name: string
  }
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [classes, setClasses] = useState<ClassRecord[]>([])
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([])
  const [teachers, setTeachers] = useState<UserRecord[]>([])
  const [students, setStudents] = useState<UserRecord[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'enrollments' | 'fingerprint'>('users')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<UserRecord | null>(null)
  const [formState, setFormState] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userName, setUserName] = useState('')
  const [fingerprintStage, setFingerprintStage] = useState<'idle' | 'place' | 'scanning' | 'lift' | 'success'>('idle')

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const roleOptions = useMemo(
    () => [
      { label: 'Student', value: 'STUDENT' },
      { label: 'Teacher', value: 'TEACHER' },
      { label: 'Admin', value: 'ADMIN' },
    ],
    []
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, classesRes, enrollmentsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/classes'),
        fetch('/api/admin/enrollments'),
      ])

      const usersJson = await usersRes.json()
      const classesJson = await classesRes.json()
      const enrollmentsJson = await enrollmentsRes.json()

      setUsers(usersJson.users)
      setClasses(classesJson.classes)
      setEnrollments(enrollmentsJson.enrollments)
      setTeachers(usersJson.users.filter((user: UserRecord) => user.role === 'TEACHER'))
      setStudents(usersJson.users.filter((user: UserRecord) => user.role === 'STUDENT'))
    } catch (err) {
      console.error(err)
      setError('Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  const openUserModal = (mode: 'create' | 'edit', user?: UserRecord) => {
    setModalMode(mode)
    setSelectedUser(user || null)
    setSelectedClass(null)
    setSelectedEnrollment(null)
    setSelectedStudent(null)
    setFormState(
      user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            student_id: user.student?.student_id ?? '',
            fingerprint_id: user.student?.fingerprint_id ?? '',
            guardian_email: user.student?.guardian_email ?? '',
            employee_id: user.teacher?.employee_id ?? '',
          }
        : {
            role: 'STUDENT',
            name: '',
            email: '',
            password: '',
            student_id: '',
            fingerprint_id: '',
            guardian_email: '',
            employee_id: '',
          }
    )
    setModalOpen(true)
  }

  const openClassModal = (mode: 'create' | 'edit', klass?: ClassRecord) => {
    setModalMode(mode)
    setSelectedClass(klass || null)
    setSelectedUser(null)
    setSelectedEnrollment(null)
    setSelectedStudent(null)
    setFormState(klass ? { name: klass.name, schedule: klass.schedule, teacherId: klass.teacher.id } : { name: '', schedule: '', teacherId: '' })
    setModalOpen(true)
  }

  const openEnrollmentModal = () => {
    setModalMode('create')
    setSelectedEnrollment(null)
    setSelectedUser(null)
    setSelectedClass(null)
    setSelectedStudent(null)
    setFormState({ studentId: '', classId: '' })
    setModalOpen(true)
  }

  const openFingerprintModal = (student?: UserRecord) => {
    setModalMode('edit')
    setSelectedStudent(student || null)
    setSelectedUser(null)
    setSelectedClass(null)
    setSelectedEnrollment(null)
    setFormState({ fingerprint_id: student?.student?.fingerprint_id ?? '' })
    setFingerprintStage('idle')
    setModalOpen(true)
  }

  const generateFingerprintId = () => {
    return 'FP-' + Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const runFingerprintSimulation = async () => {
    setFingerprintStage('place')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setFingerprintStage('scanning')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setFingerprintStage('lift')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setFingerprintStage('success')
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const newFingerprintId = generateFingerprintId()
    setFormState({ fingerprint_id: newFingerprintId })
    setFingerprintStage('idle')
  }

  const handleSaveUser = async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = '/api/admin/users'
      const method = modalMode === 'create' ? 'POST' : 'PATCH'
      const idSegment = selectedUser?.id ? `/${selectedUser.id}` : ''
      const payload = {
        ...formState,
        password: modalMode === 'create' ? formState.password : undefined,
      }

      const res = await fetch(`${endpoint}${idSegment}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save user')
      }

      await fetchData()
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClass = async () => {
    setLoading(true)
    setError('')
    try {
      const endpoint = '/api/admin/classes'
      const method = modalMode === 'create' ? 'POST' : 'PATCH'
      const idSegment = selectedClass?.id ? `/${selectedClass.id}` : ''
      const res = await fetch(`${endpoint}${idSegment}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save class')
      }

      await fetchData()
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEnrollment = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create enrollment')
      }

      await fetchData()
      setModalOpen(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFingerprint = async () => {
    if (!selectedStudent) return
    setLoading(true)
    setError('')
    try {
      const requestBody = {
        studentId: selectedStudent.student?.id,
        fingerprint_id: formState.fingerprint_id,
      }
      console.log('[Fingerprint Save] Request body:', requestBody)

      const res = await fetch('/api/admin/fingerprint', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await res.json()
      console.log('[Fingerprint Save] Response:', data)

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save fingerprint')
      }

      await fetchData()
      setModalOpen(false)
    } catch (err: any) {
      console.error('[Fingerprint Save] Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (type: 'user' | 'class' | 'enrollment', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/${type}s/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar role="ADMIN" userName={userName} onLogout={handleLogout} />
      
      <main className="flex-1 lg:ml-64 p-6 lg:p-8 bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-card rounded-xl p-6 shadow-sm border">
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, classes, enrollments, and fingerprint registrations.</p>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{classes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{students.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{enrollments.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Error */}
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">{error}</div>}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {['users', 'classes', 'enrollments', 'fingerprint'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>

          {/* Content */}
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
              <p className="text-muted-foreground">
                {activeTab === 'users' && 'Create and manage teacher and student accounts.'}
                {activeTab === 'classes' && 'Create classes and assign teachers.'}
                {activeTab === 'enrollments' && 'Assign students to classes.'}
                {activeTab === 'fingerprint' && 'Register fingerprint IDs for students.'}
              </p>
            </div>
            <Button
              onClick={() => {
                if (activeTab === 'users') openUserModal('create')
                if (activeTab === 'classes') openClassModal('create')
                if (activeTab === 'enrollments') openEnrollmentModal()
                if (activeTab === 'fingerprint') openFingerprintModal(students[0])
              }}
            >
              Add {activeTab === 'users' ? 'User' : activeTab === 'classes' ? 'Class' : activeTab === 'enrollments' ? 'Enrollment' : 'Student'}
            </Button>
          </div>

          {activeTab === 'users' && (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Details</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 text-sm text-foreground">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{user.role}</td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {user.role === 'STUDENT' ? (
                          <div className="space-y-1 text-sm">
                            <div>Student ID: {user.student?.student_id}</div>
                            <div>Fingerprint: {user.student?.fingerprint_id || 'N/A'}</div>
                            <div>Guardian: {user.student?.guardian_email}</div>
                          </div>
                        ) : user.role === 'TEACHER' ? (
                          <div className="text-sm">Employee ID: {user.teacher?.employee_id}</div>
                        ) : (
                          'Admin'
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openUserModal('edit', user)}
                          className="rounded-lg bg-muted px-3 py-1 text-foreground hover:bg-muted/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete('user', user.id)}
                          className="rounded-lg bg-destructive/10 px-3 py-1 text-destructive hover:bg-destructive/20"
                        >
                          Delete
                        </button>
                        {user.role === 'STUDENT' && (
                          <button
                            onClick={() => openFingerprintModal(user)}
                            className="rounded-lg bg-primary/10 px-3 py-1 text-primary hover:bg-primary/20"
                          >
                            Fingerprint
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'classes' && (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Class Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Schedule</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Teacher</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classes.map((klass) => (
                    <tr key={klass.id}>
                      <td className="px-6 py-4 text-sm text-foreground">{klass.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{klass.schedule}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{klass.teacher.user.name}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => openClassModal('edit', klass)}
                          className="rounded-lg bg-muted px-3 py-1 text-foreground hover:bg-muted/80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete('class', klass.id)}
                          className="rounded-lg bg-destructive/10 px-3 py-1 text-destructive hover:bg-destructive/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Student</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Class</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="px-6 py-4 text-sm text-foreground">{enrollment.student.user.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{enrollment.class.name}</td>
                      <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleDelete('enrollment', enrollment.id)}
                          className="rounded-lg bg-destructive/10 px-3 py-1 text-destructive hover:bg-destructive/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'fingerprint' && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                {students.map((student) => (
                  <div key={student.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{student.name}</p>
                      {student.student?.fingerprint_id && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          Fingerprint Registered
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{student.email}</p>
                    <p className="text-muted-foreground text-sm">Student ID: {student.student?.student_id}</p>
                    <p className="text-muted-foreground text-sm">Fingerprint ID: {student.student?.fingerprint_id || 'Not registered'}</p>
                    <button
                      onClick={() => openFingerprintModal(student)}
                      className="mt-3 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      {student.student?.fingerprint_id ? 'Re-register Fingerprint' : 'Register Fingerprint'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {activeTab === 'users'
                    ? modalMode === 'create'
                      ? 'Create User'
                      : 'Edit User'
                    : activeTab === 'classes'
                    ? modalMode === 'create'
                      ? 'Create Class'
                      : 'Edit Class'
                    : activeTab === 'enrollments'
                    ? 'Create Enrollment'
                    : 'Register Fingerprint'}
                </h3>
                <p className="text-muted-foreground mt-1">Use the form below to submit details.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-full bg-muted p-2 text-foreground hover:bg-muted/80">
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {activeTab === 'users' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Name</span>
                      <input
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Email</span>
                      <input
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-foreground">Role</span>
                      <select
                        value={formState.role}
                        onChange={(e) => setFormState({ ...formState, role: e.target.value })}
                        className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {roleOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {modalMode === 'create' && (
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">Password</span>
                        <input
                          type="password"
                          value={formState.password}
                          onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                    )}
                  </div>

                  {formState.role === 'STUDENT' && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">Student ID</span>
                        <input
                          value={formState.student_id}
                          onChange={(e) => setFormState({ ...formState, student_id: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">Fingerprint ID</span>
                        <input
                          value={formState.fingerprint_id}
                          onChange={(e) => setFormState({ ...formState, fingerprint_id: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">Guardian Email</span>
                        <input
                          value={formState.guardian_email}
                          onChange={(e) => setFormState({ ...formState, guardian_email: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                    </div>
                  )}

                  {formState.role === 'TEACHER' && (
                    <div className="grid gap-4 md:grid-cols-1">
                      <label className="block">
                        <span className="text-sm font-medium text-foreground">Employee ID</span>
                        <input
                          value={formState.employee_id}
                          onChange={(e) => setFormState({ ...formState, employee_id: e.target.value })}
                          className="mt-2 w-full rounded-xl border border-input px-4 py-3 bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </label>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'classes' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Class Name</span>
                    <input
                      value={formState.name}
                      onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Schedule</span>
                    <input
                      value={formState.schedule}
                      onChange={(e) => setFormState({ ...formState, schedule: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-sm font-medium text-foreground">Teacher</span>
                    <select
                      value={formState.teacherId}
                      onChange={(e) => setFormState({ ...formState, teacherId: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name} ({teacher.teacher?.employee_id})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {activeTab === 'enrollments' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Student</span>
                    <select
                      value={formState.studentId}
                      onChange={(e) => setFormState({ ...formState, studentId: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.student?.student_id})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-foreground">Class</span>
                    <select
                      value={formState.classId}
                      onChange={(e) => setFormState({ ...formState, classId: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select class</option>
                      {classes.map((klass) => (
                        <option key={klass.id} value={klass.id}>
                          {klass.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {activeTab === 'fingerprint' && selectedStudent && (
                <div className="flex flex-col items-center py-8">
                  <div className="mb-4 text-center">
                    <p className="text-sm font-medium text-foreground">Student</p>
                    <p className="text-lg font-semibold text-foreground">{selectedStudent.name}</p>
                  </div>

                  {fingerprintStage === 'idle' && (
                    <div className="flex flex-col items-center gap-4">
                      <Fingerprint className="w-32 h-32 text-blue-500" />
                      <p className="text-muted-foreground">Click below to start fingerprint registration</p>
                      <button
                        onClick={runFingerprintSimulation}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Processing...' : 'Start Registration'}
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
                          <div className="w-full h-1 bg-blue-400 animate-[scan_1.5s_linear_forwards]" style={{ animation: 'scan 1.5s linear forwards' }}></div>
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

                  {fingerprintStage === 'lift' && (
                    <div className="flex flex-col items-center gap-4">
                      <Fingerprint className="w-32 h-32 text-blue-500" />
                      <p className="text-lg font-semibold text-blue-600">Lift finger...</p>
                    </div>
                  )}

                  {fingerprintStage === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-green-600">Registered!</p>
                    </div>
                  )}

                  {formState.fingerprint_id && fingerprintStage === 'idle' && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">Generated Fingerprint ID:</p>
                      <p className="text-lg font-mono font-semibold text-foreground">{formState.fingerprint_id}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'users') handleSaveUser()
                  if (activeTab === 'classes') handleSaveClass()
                  if (activeTab === 'enrollments') handleSaveEnrollment()
                  if (activeTab === 'fingerprint') handleSaveFingerprint()
                }}
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 disabled:bg-slate-400"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <AIAssistant role="ADMIN" />
    </div>
  )
}
