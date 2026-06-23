import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const protectedRoutes = ['/admin', '/teacher', '/student', '/guardian']
const roleRoutes: Record<string, string> = {
  '/admin': 'ADMIN',
  '/teacher': 'TEACHER',
  '/student': 'STUDENT',
  '/guardian': 'GUARDIAN',
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (pathname === '/guardian/login') {
    return NextResponse.next()
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const token =
      pathname.startsWith('/guardian')
        ? request.cookies.get('guardian_auth_token')?.value
        : request.cookies.get('auth_token')?.value

    if (!token) {
      const loginUrl = pathname.startsWith('/guardian') ? '/guardian/login' : '/login'
      return NextResponse.redirect(new URL(loginUrl, request.url))
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check role-based access
    for (const [route, requiredRole] of Object.entries(roleRoutes)) {
      if (pathname.startsWith(route) && decoded.role !== requiredRole) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/guardian/:path*'],
}
