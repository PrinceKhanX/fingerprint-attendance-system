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

  const roleColors = {
    ADMIN: {
      primary: 'from-blue-500 to-indigo-600',
      border: 'border-blue-200',
      hoverBorder: 'hover:border-blue-400',
      focus: 'focus:ring-blue-500',
      text: 'text-blue-600',
    },
    TEACHER: {
      primary: 'from-teal-500 to-emerald-600',
      border: 'border-teal-200',
      hoverBorder: 'hover:border-teal-400',
      focus: 'focus:ring-teal-500',
      text: 'text-teal-600',
    },
    STUDENT: {
      primary: 'from-amber-500 to-orange-600',
      border: 'border-amber-200',
      hoverBorder: 'hover:border-amber-400',
      focus: 'focus:ring-amber-500',
      text: 'text-amber-600',
    },
    GUARDIAN: {
      primary: 'from-purple-500 to-violet-600',
      border: 'border-purple-200',
      hoverBorder: 'hover:border-purple-400',
      focus: 'focus:ring-purple-500',
      text: 'text-purple-600',
    },
  }

  const currentColor = roleColors[role as keyof typeof roleColors] || roleColors.STUDENT

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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden p-4">
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

      <div className={`w-full max-w-md relative z-10 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <Card className={`border-2 ${currentColor.border} ${currentColor.hoverBorder} bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-300/50`}>
          <CardHeader className="space-y-4 text-center pb-6">
            {/* Fingerprint icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mx-auto animate-float">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Fingerprint Attendance
              </CardTitle>
              <CardDescription className="text-base mt-2">Sign in to your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 border-2 border-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field with icon */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className={`pl-10 border-2 ${currentColor.border} ${currentColor.hoverBorder} focus-visible:ring-2 ${currentColor.focus} transition-all duration-200`}
                  />
                </div>
              </div>

              {/* Password field with icon */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className={`pl-10 border-2 ${currentColor.border} ${currentColor.hoverBorder} focus-visible:ring-2 ${currentColor.focus} transition-all duration-200`}
                  />
                </div>
              </div>

              {/* Role dropdown */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role" className={`border-2 ${currentColor.border} ${currentColor.hoverBorder} focus:ring-2 ${currentColor.focus} transition-all duration-200`}>
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

              {/* Login button with gradient */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r ${currentColor.primary} hover:opacity-90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Login
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-6">
            <p className="text-center text-sm text-slate-600">
              <Link href="/guardian/login" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline transition-colors flex items-center gap-1 justify-center">
                Guardian portal login
                <ChevronRight className="h-3 w-3" />
              </Link>
            </p>

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors">
                Register
              </Link>
            </p>

            {/* Demo credentials section */}
            <div className="pt-4 border-t border-slate-200 w-full">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span>Demo Credentials</span>
                <ChevronRight className={`h-3 w-3 transition-transform ${showDemo ? 'rotate-90' : ''}`} />
              </button>
              {showDemo && (
                <div className="mt-3 space-y-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-600">Admin:</span>
                    <span>admin@example.com / admin123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-teal-600">Teacher:</span>
                    <span>teacher@example.com / teacher123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-amber-600">Student:</span>
                    <span>student@example.com / student123</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-purple-600">Guardian:</span>
                    <span>guardian@example.com / guardian123</span>
                  </div>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
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

import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
