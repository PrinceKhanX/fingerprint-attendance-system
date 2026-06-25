'use client'

import Link from 'next/link'
import { Settings, BookOpen, GraduationCap, Fingerprint } from 'lucide-react'
import { useEffect, useState } from 'react'

const cards = [
  {
    title: 'Admin',
    description: 'Manage users, classes, and attendance settings.',
    href: '/login?role=ADMIN',
    icon: Settings,
    color: 'from-blue-500 to-indigo-600',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
  },
  {
    title: 'Teacher',
    description: 'Track classes and mark attendance.',
    href: '/login?role=TEACHER',
    icon: BookOpen,
    color: 'from-indigo-500 to-purple-600',
    borderColor: 'border-indigo-200',
    hoverBorder: 'hover:border-indigo-400',
  },
  {
    title: 'Student',
    description: 'Review your attendance records.',
    href: '/login?role=STUDENT',
    icon: GraduationCap,
    color: 'from-purple-500 to-pink-600',
    borderColor: 'border-purple-200',
    hoverBorder: 'hover:border-purple-400',
  },
]

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className={`w-full max-w-4xl relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="rounded-3xl border border-slate-200/60 bg-white/80 backdrop-blur-xl p-10 shadow-2xl shadow-slate-300/50">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-6 animate-float">
              <Fingerprint className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
              Fingerprint Attendance
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Secure, efficient, and modern attendance tracking system. Select your role to get started.
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-6 sm:grid-cols-3">
            {cards.map((card, index) => {
              const Icon = card.icon
              return (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`group relative overflow-hidden rounded-2xl border-2 ${card.borderColor} ${card.hoverBorder} bg-white p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:scale-105`}
                  style={{
                    animationDelay: `${index * 150}ms`,
                  }}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                    {card.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    {card.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Guardian link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-400">
              Are you a guardian?{' '}
              <Link href="/login?role=GUARDIAN" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                Click here
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Fingerprint Attendance System. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
