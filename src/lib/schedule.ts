const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export function isClassScheduledToday(schedule: string, date = new Date()) {
  const today = DAY_LABELS[date.getDay()]
  const daysPart = schedule.split('-')[0]?.trim() ?? ''
  return daysPart.split(',').map((d) => d.trim()).includes(today)
}

export function aggregateDayStatus(statuses: string[]): 'PRESENT' | 'LATE' | 'ABSENT' | null {
  if (statuses.length === 0) return null
  if (statuses.includes('ABSENT')) return 'ABSENT'
  if (statuses.includes('LATE')) return 'LATE'
  return 'PRESENT'
}

export function attendancePercentage(present: number, late: number, absent: number) {
  const total = present + late + absent
  if (total === 0) return 0
  return Math.round(((present + late) / total) * 100)
}
