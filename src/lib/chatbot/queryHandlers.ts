import { getDayBounds } from '@/lib/attendance'
import { attendancePercentage, todayString } from '@/lib/schedule'
import { prisma } from '@/lib/prisma'
import type {
  AdminAuthContext,
  ChatAuthContext,
  GuardianAuthContext,
  Intent,
  StudentAuthContext,
  TeacherAuthContext,
} from './types'

function dateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

// ─── Student handlers ─────────────────────────────────────────────────────────

async function getStudentAttendance(auth: StudentAuthContext, todayOnly = false): Promise<string> {
  const today = todayString()
  const { start, end } = getDayBounds(today)

  const records = await prisma.attendance.findMany({
    where: {
      studentId: auth.studentId,
      ...(todayOnly ? { timestamp: { gte: start, lte: end } } : {}),
    },
    include: { class: { select: { name: true } } },
    orderBy: { timestamp: 'desc' },
    take: todayOnly ? 20 : 10,
  })

  if (records.length === 0) {
    return todayOnly
      ? `Hi ${auth.name}, you have no attendance records for today (${today}).`
      : `Hi ${auth.name}, you have no attendance records yet.`
  }

  const header = todayOnly
    ? `Today's attendance for ${auth.name} (${today}):`
    : `Recent attendance for ${auth.name}:`

  const lines = records.map(
    (r) => `• ${dateKey(r.timestamp)} — ${r.class.name}: ${formatStatus(r.status)} (${r.marked_by.toLowerCase()})`
  )

  return `${header}\n\n${lines.join('\n')}`
}

async function getStudentAttendancePercentage(auth: StudentAuthContext): Promise<string> {
  const records = await prisma.attendance.findMany({
    where: { studentId: auth.studentId },
    select: { status: true },
  })

  let present = 0
  let late = 0
  let absent = 0
  for (const r of records) {
    if (r.status === 'PRESENT') present++
    else if (r.status === 'LATE') late++
    else absent++
  }

  const pct = attendancePercentage(present, late, absent)
  const enrolled = await prisma.enrollment.count({ where: { studentId: auth.studentId } })

  return (
    `Attendance summary for ${auth.name}:\n\n` +
    `• Overall rate: ${pct}%\n` +
    `• Present: ${present} | Late: ${late} | Absent: ${absent}\n` +
    `• Enrolled classes: ${enrolled}\n` +
    `• Total records: ${records.length}`
  )
}

async function getStudentClasses(auth: StudentAuthContext): Promise<string> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: auth.studentId },
    include: {
      class: {
        select: {
          name: true,
          schedule: true,
          teacher: { select: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { class: { name: 'asc' } },
  })

  if (enrollments.length === 0) {
    return `${auth.name}, you are not enrolled in any classes yet.`
  }

  const lines = enrollments.map(
    (e, i) =>
      `${i + 1}. ${e.class.name}\n   Schedule: ${e.class.schedule}\n   Teacher: ${e.class.teacher.user.name}`
  )

  return `Your enrolled classes (${enrollments.length}):\n\n${lines.join('\n\n')}`
}

async function getStudentMissedClasses(auth: StudentAuthContext): Promise<string> {
  const records = await prisma.attendance.findMany({
    where: { studentId: auth.studentId, status: 'ABSENT' },
    include: { class: { select: { name: true } } },
    orderBy: { timestamp: 'desc' },
    take: 10,
  })

  if (records.length === 0) {
    return `Great news, ${auth.name}! You have no recorded absences.`
  }

  const lines = records.map(
    (r) => `• ${dateKey(r.timestamp)} — ${r.class.name} (Absent)`
  )

  return `Missed classes / absences for ${auth.name} (latest ${records.length}):\n\n${lines.join('\n')}`
}

// ─── Teacher handlers ─────────────────────────────────────────────────────────

async function getTeacherClasses(auth: TeacherAuthContext): Promise<string> {
  const classes = await prisma.class.findMany({
    where: { teacherId: auth.teacherId },
    select: {
      name: true,
      schedule: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { name: 'asc' },
  })

  if (classes.length === 0) {
    return `${auth.name}, you have no assigned classes.`
  }

  const lines = classes.map(
    (c, i) =>
      `${i + 1}. ${c.name}\n   Schedule: ${c.schedule}\n   Enrolled students: ${c._count.enrollments}`
  )

  return `Your classes (${classes.length}):\n\n${lines.join('\n\n')}`
}

async function getTeacherClassSummary(auth: TeacherAuthContext): Promise<string> {
  const date = todayString()
  const { start, end } = getDayBounds(date)

  const classes = await prisma.class.findMany({
    where: { teacherId: auth.teacherId },
    include: {
      enrollments: { select: { studentId: true } },
      attendance: {
        where: { timestamp: { gte: start, lte: end } },
        select: { studentId: true, status: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  if (classes.length === 0) {
    return `${auth.name}, you have no assigned classes.`
  }

  const lines = classes.map((c) => {
    const enrolled = c.enrollments.length
    const present = c.attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length
    const rate = enrolled > 0 ? Math.round((present / enrolled) * 100) : 0
    return `• ${c.name}: ${present}/${enrolled} present today (${rate}%)`
  })

  return `Class attendance summary for ${date}:\n\n${lines.join('\n')}`
}

async function getTeacherAbsentStudents(auth: TeacherAuthContext): Promise<string> {
  const date = todayString()
  const { start, end } = getDayBounds(date)

  const classes = await prisma.class.findMany({
    where: { teacherId: auth.teacherId },
    select: { id: true, name: true },
  })

  if (classes.length === 0) {
    return `${auth.name}, you have no assigned classes.`
  }

  const sections: string[] = []

  for (const cls of classes) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: cls.id },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            attendance: {
              where: { classId: cls.id, timestamp: { gte: start, lte: end } },
            },
          },
        },
      },
    })

    const absent = enrollments.filter(({ student }) => {
      const record = student.attendance[0]
      return !record || record.status === 'ABSENT'
    })

    if (absent.length === 0) continue

    const names = absent
      .map(({ student }) => `${student.user.name} (${student.student_id})`)
      .join(', ')

    sections.push(`• ${cls.name}: ${names}`)
  }

  if (sections.length === 0) {
    return `No absent or unmarked students found across your classes for ${date}.`
  }

  return `Absent / unmarked students for ${date}:\n\n${sections.join('\n')}`
}

async function getTeacherAttendanceReport(auth: TeacherAuthContext): Promise<string> {
  const classes = await prisma.class.findMany({
    where: { teacherId: auth.teacherId },
    include: {
      enrollments: { select: { studentId: true } },
      attendance: { select: { status: true, studentId: true } },
    },
  })

  if (classes.length === 0) {
    return `${auth.name}, you have no assigned classes.`
  }

  const lines = classes.map((c) => {
    const enrolledIds = new Set(c.enrollments.map((e) => e.studentId))
    const classRecords = c.attendance.filter((a) => enrolledIds.has(a.studentId))

    let present = 0
    let late = 0
    let absent = 0
    for (const r of classRecords) {
      if (r.status === 'PRESENT') present++
      else if (r.status === 'LATE') late++
      else absent++
    }

    const pct = attendancePercentage(present, late, absent)
    return (
      `• ${c.name}\n` +
      `  Enrolled: ${c.enrollments.length} | Records: ${classRecords.length}\n` +
      `  Present: ${present} | Late: ${late} | Absent: ${absent} | Rate: ${pct}%`
    )
  })

  return `Attendance report for your classes:\n\n${lines.join('\n\n')}`
}

// ─── Guardian handlers ──────────────────────────────────────────────────────

async function getGuardianStudentAttendance(auth: GuardianAuthContext): Promise<string> {
  const students = await prisma.student.findMany({
    where: { guardian_email: auth.email },
    include: {
      user: { select: { name: true } },
      attendance: {
        include: { class: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
        take: 5,
      },
    },
  })

  if (students.length === 0) {
    return `${auth.name}, no students are linked to your guardian account.`
  }

  const sections = students.map((student) => {
    if (student.attendance.length === 0) {
      return `• ${student.user.name}: no attendance records yet`
    }
    const lines = student.attendance.map(
      (r) => `  - ${dateKey(r.timestamp)} ${r.class.name}: ${formatStatus(r.status)}`
    )
    return `• ${student.user.name}:\n${lines.join('\n')}`
  })

  return `Child attendance (recent records):\n\n${sections.join('\n\n')}`
}

async function getGuardianAttendancePercentage(auth: GuardianAuthContext): Promise<string> {
  const students = await prisma.student.findMany({
    where: { guardian_email: auth.email },
    include: {
      user: { select: { name: true } },
      attendance: { select: { status: true } },
    },
  })

  if (students.length === 0) {
    return `${auth.name}, no students are linked to your guardian account.`
  }

  const lines = students.map((student) => {
    let present = 0
    let late = 0
    let absent = 0
    for (const r of student.attendance) {
      if (r.status === 'PRESENT') present++
      else if (r.status === 'LATE') late++
      else absent++
    }
    const pct = attendancePercentage(present, late, absent)
    return `• ${student.user.name}: ${pct}% (Present ${present}, Late ${late}, Absent ${absent})`
  })

  return `Child attendance percentages:\n\n${lines.join('\n')}`
}

async function getGuardianAlerts(auth: GuardianAuthContext): Promise<string> {
  const students = await prisma.student.findMany({
    where: { guardian_email: auth.email },
    include: {
      user: { select: { name: true } },
      attendance: {
        where: { status: { in: ['LATE', 'ABSENT'] } },
        include: { class: { select: { name: true } } },
        orderBy: { timestamp: 'desc' },
        take: 10,
      },
    },
  })

  const alerts = students.flatMap((student) =>
    student.attendance.map((r) => ({
      child: student.user.name,
      date: dateKey(r.timestamp),
      status: r.status,
      className: r.class.name,
    }))
  )

  if (alerts.length === 0) {
    return `No late or absent alerts for your linked students.`
  }

  const lines = alerts
    .slice(0, 10)
    .map((a) => `• ${a.child} — ${a.date} — ${a.className}: ${formatStatus(a.status)}`)

  return `Recent attendance alerts:\n\n${lines.join('\n')}`
}

// ─── Admin handlers ───────────────────────────────────────────────────────────

async function getAdminStatistics(auth: AdminAuthContext): Promise<string> {
  const [students, teachers, classes, guardians, attendanceRecords] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.guardian.count(),
    prisma.attendance.findMany({ select: { status: true } }),
  ])

  let present = 0
  let late = 0
  let absent = 0
  for (const r of attendanceRecords) {
    if (r.status === 'PRESENT') present++
    else if (r.status === 'LATE') late++
    else absent++
  }

  const pct = attendancePercentage(present, late, absent)

  return (
    `System statistics:\n\n` +
    `• Total students: ${students}\n` +
    `• Total teachers: ${teachers}\n` +
    `• Total classes: ${classes}\n` +
    `• Total guardians: ${guardians}\n` +
    `• Attendance records: ${attendanceRecords.length}\n` +
    `• Overall attendance rate: ${pct}%\n` +
    `• Present: ${present} | Late: ${late} | Absent: ${absent}`
  )
}

// ─── Intent router with role-based permission checks ──────────────────────────

export async function handleDatabaseIntent(
  intent: Intent,
  auth: ChatAuthContext,
  message: string
): Promise<string> {
  const text = message.toLowerCase()
  const todayOnly = /today/.test(text)

  switch (intent) {
    case 'ATTENDANCE_PERCENTAGE':
      if (auth.role === 'STUDENT') return getStudentAttendancePercentage(auth)
      if (auth.role === 'GUARDIAN') return getGuardianAttendancePercentage(auth)
      if (auth.role === 'TEACHER') return getTeacherClassSummary(auth)
      if (auth.role === 'ADMIN') return getAdminStatistics(auth)
      break

    case 'SHOW_MY_CLASSES':
      if (auth.role === 'STUDENT') return getStudentClasses(auth)
      if (auth.role === 'TEACHER') return getTeacherClasses(auth)
      return `Class listings are available for students and teachers. As ${auth.role.toLowerCase()}, use attendance or statistics queries instead.`

    case 'SHOW_ATTENDANCE':
      if (auth.role === 'STUDENT') {
        if (/missed/.test(text)) return getStudentMissedClasses(auth)
        return getStudentAttendance(auth, todayOnly)
      }
      if (auth.role === 'GUARDIAN') return getGuardianStudentAttendance(auth)
      if (auth.role === 'TEACHER') return getTeacherClassSummary(auth)
      if (auth.role === 'ADMIN') return getAdminStatistics(auth)
      break

    case 'SHOW_ABSENT_STUDENTS':
      if (auth.role === 'TEACHER') return getTeacherAbsentStudents(auth)
      if (auth.role === 'ADMIN') {
        return `Absent-student lists are available per teacher class. As admin, view system-wide stats or open /analytics for charts.\n\n${await getAdminStatistics(auth)}`
      }
      return `Absent student lists are only available to teachers for their own classes.`

    case 'SHOW_REPORT':
      if (auth.role === 'TEACHER') return getTeacherAttendanceReport(auth)
      if (auth.role === 'GUARDIAN') return getGuardianAlerts(auth)
      if (auth.role === 'STUDENT') return getStudentAttendance(auth)
      if (auth.role === 'ADMIN') return getAdminStatistics(auth)
      break

    case 'SHOW_STATISTICS':
      if (auth.role === 'ADMIN') return getAdminStatistics(auth)
      if (auth.role === 'TEACHER') return getTeacherAttendanceReport(auth)
      if (auth.role === 'STUDENT') return getStudentAttendancePercentage(auth)
      if (auth.role === 'GUARDIAN') return getGuardianAttendancePercentage(auth)
      break
  }

  throw new Error(`Unable to handle intent "${intent}" for role ${auth.role}.`)
}
