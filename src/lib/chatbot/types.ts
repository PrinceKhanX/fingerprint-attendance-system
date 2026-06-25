export type ChatRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN'

export type Intent =
  | 'ATTENDANCE_PERCENTAGE'
  | 'SHOW_MY_CLASSES'
  | 'SHOW_ATTENDANCE'
  | 'SHOW_ABSENT_STUDENTS'
  | 'SHOW_REPORT'
  | 'SHOW_STATISTICS'
  | 'GENERAL_HELP'
  | 'UNKNOWN'

export type ResponseSource = 'database' | 'ai'

export interface StudentAuthContext {
  role: 'STUDENT'
  userId: string
  studentId: string
  name: string
}

export interface TeacherAuthContext {
  role: 'TEACHER'
  userId: string
  teacherId: string
  name: string
}

export interface GuardianAuthContext {
  role: 'GUARDIAN'
  userId: string
  guardianId: string
  email: string
  name: string
}

export interface AdminAuthContext {
  role: 'ADMIN'
  userId: string
  email: string
  name: string
}

export type ChatAuthContext =
  | StudentAuthContext
  | TeacherAuthContext
  | GuardianAuthContext
  | AdminAuthContext

export interface ChatbotResponse {
  answer: string
  source: ResponseSource
  intent: Intent
  timestamp: string
}

/** Intents that must be answered from Prisma — never AI. */
export const DATABASE_INTENTS: ReadonlySet<Intent> = new Set([
  'ATTENDANCE_PERCENTAGE',
  'SHOW_MY_CLASSES',
  'SHOW_ATTENDANCE',
  'SHOW_ABSENT_STUDENTS',
  'SHOW_REPORT',
  'SHOW_STATISTICS',
])
