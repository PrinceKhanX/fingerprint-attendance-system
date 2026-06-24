'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  UserCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Moon,
  Sun,
} from 'lucide-react'

interface SidebarProps {
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN'
  userName?: string
  onLogout?: () => void
}

export function DashboardSidebar({ role, userName, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  const adminNavItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const teacherNavItems = [
    { href: '/teacher/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/teacher/attendance', icon: UserCheck, label: 'Manual Attendance' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const studentNavItems = [
    { href: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  const guardianNavItems = [
    { href: '/guardian/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]

  const navItems = 
    role === 'ADMIN' ? adminNavItems :
    role === 'TEACHER' ? teacherNavItems :
    role === 'STUDENT' ? studentNavItems :
    guardianNavItems

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          ${collapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                {role === 'ADMIN' && <Shield className="h-5 w-5" />}
                {role === 'TEACHER' && <BookOpen className="h-5 w-5" />}
                {role === 'STUDENT' && <User className="h-5 w-5" />}
                {role === 'GUARDIAN' && <Users className="h-5 w-5" />}
              </div>
              {!collapsed && (
                <div>
                  <h2 className="font-semibold text-slate-900">{role}</h2>
                  {userName && <p className="text-xs text-slate-500">{userName}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`
                      w-full justify-start gap-3
                      ${collapsed ? 'px-3' : 'px-4'}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200 space-y-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`
                    w-full justify-start gap-3
                    ${collapsed ? 'px-3' : 'px-4'}
                  `}
                >
                  {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  {!collapsed && <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              className={`
                w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50
                ${collapsed ? 'px-3' : 'px-4'}
              `}
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setCollapsed(false)}
        />
      )}
    </>
  )
}
