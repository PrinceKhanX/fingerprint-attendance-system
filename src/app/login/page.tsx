'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTheme } from '@/components/theme-provider'
import { Moon, Sun, Fingerprint, Mail, Lock, ChevronRight } from 'lucide-react'

function LoginPageContent() {
  const searchParams = useSearchParams()
  const roleParam = searchParams?.get('role') || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(roleParam || 'STUDENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const [rememberMe, setRememberMe] = useState(false)

  const roleColors = {
    ADMIN: {
      primary: '#2563EB',
      primaryGradient: 'from-blue-600 to-blue-700',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      focus: 'focus:ring-blue-500',
      text: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    TEACHER: {
      primary: '#0D9488',
      primaryGradient: 'from-teal-600 to-teal-700',
      border: 'border-teal-200',
      hoverBorder: 'hover:border-teal-400',
      focus: 'focus:ring-teal-500',
      text: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    STUDENT: {
      primary: '#F59E0B',
      primaryGradient: 'from-amber-500 to-amber-600',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      focus: 'focus:ring-amber-500',
      text: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    GUARDIAN: {
      primary: '#7C3AED',
      primaryGradient: 'from-purple-600 to-purple-700',
      border: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      focus: 'focus:ring-purple-500',
      text: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  }

  const currentColor = roleColors[role as keyof typeof roleColors] || roleColors.STUDENT

  const roleTitles = {
    ADMIN: 'Admin Login',
    TEACHER: 'Teacher Login',
    STUDENT: 'Student Login',
    GUARDIAN: 'Guardian Login',
  }

  useEffect(() => {
    setMounted(true)
    if (roleParam) {
      setRole(roleParam)
    }
  }, [roleParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const isGuardian = role === 'GUARDIAN'
      const endpoint = isGuardian ? '/api/guardian/login' : '/api/auth/login'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      const roleRoutes: Record<string, string> = {
        ADMIN: '/admin/dashboard',
        TEACHER: '/teacher/dashboard',
        STUDENT: '/student/dashboard',
        GUARDIAN: '/guardian/dashboard',
      }

      const userRole = isGuardian ? 'GUARDIAN' : data.user.role
      const redirectUrl = roleRoutes[userRole] || '/login'
      console.log(`Login successful, redirecting to ${redirectUrl}`)
      
      window.location.href = redirectUrl
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden p-4 font-sans transition-colors duration-300">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 dark:bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className={`w-full max-w-5xl lg:max-w-6xl relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white dark:bg-slate-800 shadow-2xl shadow-slate-300/50 dark:shadow-slate-900/50 rounded-[24px] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 transition-colors duration-300">
          <div className="grid lg:grid-cols-2">
            {/* Left column - Branding (desktop only) */}
            <div className="hidden lg:flex p-8 lg:p-12 flex-col justify-start bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-48 h-48 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              </div>

              <div className="relative z-10 space-y-8">
                {/* Brand mark */}
                <div className="mb-4">
                  <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                    <Fingerprint className="w-4 h-4" />
                    <span className="font-medium">Fingerprint Attendance</span>
                  </Link>
                </div>

                {/* Large fingerprint icon */}
                <div className="inline-flex items-center justify-center w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-2xl relative">
                  <div className="absolute inset-0 rounded-3xl opacity-30 blur-2xl bg-blue-500" />
                  <Fingerprint className="w-16 h-16 lg:w-20 lg:h-20 text-white relative z-10" />
                </div>

                {/* App title and tagline */}
                <div className="space-y-4">
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    Fingerprint Attendance
                  </h1>
                  <p className="text-base lg:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                    Secure, efficient, and modern attendance tracking system. Experience seamless attendance management with biometric precision.
                  </p>
                </div>

                {/* Role indicator */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm border border-slate-200 dark:border-slate-600">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentColor.primary }} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {roleTitles[role as keyof typeof roleTitles] || 'Login'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column - Form */}
            <div className="p-6 sm:p-8 lg:p-16 space-y-6 sm:space-y-8 relative">
              {/* Top accent bar - thinner, more subtle */}
              <div className="h-0.5 transition-all duration-300 rounded-full" style={{ backgroundColor: currentColor.primary }} />

              {/* Mobile-only compact header */}
              <div className="lg:hidden flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors">
                  <Fingerprint className="w-4 h-4" />
                  <span className="font-medium">Fingerprint Attendance</span>
                </Link>
              </div>

              {/* Form header with role title (visible on both mobile and desktop) */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold transition-all duration-300 mb-2" style={{ color: currentColor.primary }}>
                  {roleTitles[role as keyof typeof roleTitles] || 'Login'}
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">Sign in to your account</p>
              </div>

            {/* Error alert */}
            {error && (
              <Alert variant="destructive" className="border-2 border-red-200 dark:border-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'ADMIN' ? 'admin@example.com' : role === 'TEACHER' ? 'teacher@example.com' : role === 'STUDENT' ? 'student@example.com' : 'guardian@example.com'}
                  required
                  className={`h-12 sm:h-14 px-4 sm:px-5 border-2 rounded-2xl bg-white dark:bg-slate-700 ${currentColor.border} dark:border-slate-600 ${currentColor.hoverBorder} dark:hover:border-slate-500 focus-visible:ring-2 ${currentColor.focus} transition-all duration-300 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                />
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`h-12 sm:h-14 px-4 sm:px-5 border-2 rounded-2xl bg-white dark:bg-slate-700 ${currentColor.border} dark:border-slate-600 ${currentColor.hoverBorder} dark:hover:border-slate-500 focus-visible:ring-2 ${currentColor.focus} transition-all duration-300 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500`}
                />
              </div>

              {/* Role dropdown */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className={`h-12 sm:h-14 px-4 sm:px-5 border-2 rounded-2xl bg-white dark:bg-slate-700 ${currentColor.border} dark:border-slate-600 ${currentColor.hoverBorder} dark:hover:border-slate-500 focus:ring-2 ${currentColor.focus} transition-all duration-300 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100`}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="STUDENT" className="text-slate-900 dark:text-slate-100">Student</SelectItem>
                    <SelectItem value="TEACHER" className="text-slate-900 dark:text-slate-100">Teacher</SelectItem>
                    <SelectItem value="ADMIN" className="text-slate-900 dark:text-slate-100">Admin</SelectItem>
                    <SelectItem value="GUARDIAN" className="text-slate-900 dark:text-slate-100">Guardian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 focus:ring-blue-500 transition-all duration-200"
                  style={{ accentColor: currentColor.primary }}
                />
                <Label htmlFor="remember" className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 cursor-pointer font-medium">Remember me</Label>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 sm:h-14 rounded-2xl text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 text-base sm:text-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: currentColor.primary }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Login
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                <Link href="/login?role=GUARDIAN" className="hover:underline transition-colors font-semibold" style={{ color: currentColor.primary }}>
                  Guardian portal login
                </Link>
              </p>

              <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <Link href="/register" className="font-bold hover:underline transition-colors" style={{ color: currentColor.primary }}>
                  Register
                </Link>
              </p>

              <p className="text-center text-xs sm:text-sm">
                <Link href="/" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors flex items-center justify-center gap-1 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              </p>
            </div>

            {/* Bottom accent bar - matches top accent bar for symmetry */}
            <div className="h-0.5 transition-all duration-300 rounded-full" style={{ backgroundColor: currentColor.primary }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
