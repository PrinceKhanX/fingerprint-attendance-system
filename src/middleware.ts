import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const protectedRoutes = ['/admin', '/teacher', '/student']
const roleRoutes: Record<string, string> = {
  '/admin': 'ADMIN',
  '/teacher': 'TEACHER',
  '/student': 'STUDENT',
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
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
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*'],
}
