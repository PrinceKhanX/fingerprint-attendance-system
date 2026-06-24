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
      const response = await fetch('/api/auth/login', {
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
      }

      const redirectUrl = roleRoutes[data.user.role] || '/login'
      console.log(`Login successful, redirecting to ${redirectUrl}`)
      
      window.location.href = redirectUrl
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden p-4 font-sans">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-400/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="bg-white/80 backdrop-blur-sm border-slate-200/60"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>

      <div className={`w-full max-w-[500px] relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white shadow-2xl shadow-slate-300/50 rounded-[24px] overflow-hidden border border-slate-200/50">
          {/* Decorative corner accent */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: currentColor.primary }}>
              <path d="M0 100 L100 100 L100 0 Z" />
            </svg>
          </div>

          {/* Top accent bar */}
          <div className="h-2 transition-all duration-300" style={{ backgroundColor: currentColor.primary }} />

          <div className="p-14 space-y-8">
            {/* Brand mark - AT THE TOP */}
            <div className="text-center pb-4 border-b border-slate-100">
              <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <Fingerprint className="w-3.5 h-3.5" />
                <span className="font-medium">Fingerprint Attendance</span>
              </Link>
            </div>

            {/* Header */}
            <div className="text-center space-y-4 pt-2">
              {/* Large fingerprint icon with glow */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 mb-3 relative">
                <div className="absolute inset-0 rounded-2xl opacity-20 blur-xl transition-all duration-300" style={{ backgroundColor: currentColor.primary }} />
                <Fingerprint className="w-8 h-8 text-slate-600 relative z-10" />
              </div>
              <h1 className="text-4xl font-bold transition-all duration-300" style={{ color: currentColor.primary }}>
                {roleTitles[role as keyof typeof roleTitles] || 'Login'}
              </h1>
              <p className="text-base text-slate-500 font-medium">Sign in to your account</p>
            </div>

            {/* Error alert */}
            {error && (
              <Alert variant="destructive" className="border-2 border-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700 uppercase tracking-wide">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className={`pl-12 h-14 px-5 border-2 rounded-2xl ${currentColor.border} ${currentColor.hoverBorder} focus-visible:ring-2 ${currentColor.focus} transition-all duration-300 text-base font-medium`}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700 uppercase tracking-wide">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`pl-12 h-14 px-5 border-2 rounded-2xl ${currentColor.border} ${currentColor.hoverBorder} focus-visible:ring-2 ${currentColor.focus} transition-all duration-300 text-base font-medium`}
                  />
                </div>
              </div>

              {/* Role dropdown */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-bold text-slate-700 uppercase tracking-wide">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className={`h-14 px-5 border-2 rounded-2xl ${currentColor.border} ${currentColor.hoverBorder} focus:ring-2 ${currentColor.focus} transition-all duration-300 text-base font-medium`}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="GUARDIAN">Guardian</SelectItem>
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
                  className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all duration-200"
                  style={{ accentColor: currentColor.primary }}
                />
                <Label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer font-medium">Remember me</Label>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 text-lg hover:scale-[1.02] active:scale-[0.98]"
                style={{ backgroundColor: currentColor.primary }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Login
                    <ChevronRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <p className="text-center text-sm text-slate-500">
                <Link href="/guardian/login" className="hover:underline transition-colors font-semibold" style={{ color: currentColor.primary }}>
                  Guardian portal login
                </Link>
              </p>

              <p className="text-center text-sm text-slate-500">
                Don't have an account?{' '}
                <Link href="/register" className="font-bold hover:underline transition-colors" style={{ color: currentColor.primary }}>
                  Register
                </Link>
              </p>

              <p className="text-center text-sm">
                <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to home
                </Link>
              </p>
            </div>

            {/* Demo credentials */}
            <div className="pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors py-2 font-medium"
              >
                <span>Demo Credentials</span>
                <ChevronRight className={`h-3 w-3 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
              </button>
              {showDemo && (
                <div className="mt-4 space-y-3 text-sm text-slate-600 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: roleColors.ADMIN.primary }}>Admin:</span>
                    <span className="font-mono">admin@example.com / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: roleColors.TEACHER.primary }}>Teacher:</span>
                    <span className="font-mono">teacher@example.com / teacher123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: roleColors.STUDENT.primary }}>Student:</span>
                    <span className="font-mono">student@example.com / student123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold" style={{ color: roleColors.GUARDIAN.primary }}>Guardian:</span>
                    <span className="font-mono">guardian@example.com / guardian123</span>
                  </div>
                </div>
              )}
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
