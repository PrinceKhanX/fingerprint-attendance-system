'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TeacherDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
          <button
            onClick={handleLogout}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-slate-400 transition"
          >
            {loading ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'My Classes', value: '4', icon: '📚' },
            { title: 'Total Students', value: '128', icon: '👥' },
            { title: 'Today Attendance', value: '96%', icon: '✓' },
          ].map((card) => (
            <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">{card.icon}</div>
              <p className="text-slate-600 text-sm">{card.title}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Teacher Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Mark Attendance', icon: '📝' },
              { label: 'View Class Attendance', icon: '📊' },
              { label: 'My Classes', icon: '📚' },
              { label: 'Reports', icon: '📄' },
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="font-medium text-slate-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
