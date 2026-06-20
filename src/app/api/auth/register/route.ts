import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    // Validate input
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with optional Student or Teacher record
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        student:
          role === 'STUDENT'
            ? {
                create: {
                  student_id: `STU-${Date.now()}`,
                  fingerprint_id: '',
                  guardian_email: '',
                },
              }
            : undefined,
        teacher:
          role === 'TEACHER'
            ? {
                create: {
                  employee_id: `EMP-${Date.now()}`,
                },
              }
            : undefined,
      },
    })

    // Generate token
    const token = await generateToken(user.id, user.email, user.role)

    // Create response and set auth cookie
    const response = NextResponse.json(
      {
        message: 'User registered successfully',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
      { status: 201 }
    )

    // Set cookie directly
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
