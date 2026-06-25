import type { ChatRole } from './types'

const ROLE_PROMPTS: Record<ChatRole, string> = {
  STUDENT:
    'You are helping a student use a Fingerprint Attendance Management System. Explain features clearly: viewing attendance, classes, calendar, and notifications. Do not invent personal attendance numbers — direct factual questions to the dashboard or chatbot quick actions.',
  TEACHER:
    'You are helping a teacher manage attendance and classes. Explain manual attendance marking, class dashboards, analytics, and fingerprint sensor workflow. Do not invent student lists or attendance counts.',
  GUARDIAN:
    'You are helping a guardian monitor student attendance. Explain child dashboards, alerts, push notifications, and how late/absent marks trigger notifications. Do not invent child attendance data.',
  ADMIN:
    'You are helping an administrator manage the attendance system. Explain user management, classes, enrollments, analytics at /analytics, and system overview. Do not invent system statistics.',
}

const SYSTEM_KNOWLEDGE = `
Fingerprint Attendance Management System overview:
- Roles: Admin, Teacher, Student, Guardian — each has a dedicated dashboard.
- Attendance statuses: PRESENT, LATE, ABSENT.
- Marking methods: SENSOR (fingerprint scanner) or MANUAL (teacher override).
- Students view monthly calendar and attendance percentage on /student/dashboard.
- Teachers mark attendance at /teacher/attendance and view live class stats on /teacher/dashboard.
- Guardians monitor linked children on /guardian/dashboard and receive alerts for late/absent marks.
- Admins manage users, classes, enrollments, and fingerprints on /admin/dashboard.
- Analytics charts are available at /analytics for admins and teachers.
- Push notifications can be enabled from student and guardian dashboards.
- Dark mode is available from dashboard sidebars.
`.trim()

export function getRoleContext(role: ChatRole): string {
  return `${ROLE_PROMPTS[role]}\n\n${SYSTEM_KNOWLEDGE}`
}

export function getQuickActions(role: ChatRole): { label: string; message: string }[] {
  switch (role) {
    case 'STUDENT':
      return [
        { label: 'My Attendance', message: 'Show my attendance' },
        { label: 'My Classes', message: 'Show my classes' },
        { label: 'Attendance Percentage', message: 'What is my attendance percentage?' },
      ]
    case 'TEACHER':
      return [
        { label: 'My Classes', message: 'Show my classes' },
        { label: 'Attendance Report', message: 'Show attendance report' },
        { label: 'Absent Students', message: 'Show absent students today' },
      ]
    case 'GUARDIAN':
      return [
        { label: 'Child Attendance', message: 'Show child attendance' },
        { label: 'Attendance Alerts', message: 'Show attendance alerts' },
      ]
    case 'ADMIN':
      return [
        { label: 'System Statistics', message: 'Show system statistics' },
        { label: 'Manage Users', message: 'How do I manage users?' },
        { label: 'Attendance Analytics', message: 'How do I view attendance analytics?' },
      ]
  }
}
