import type { ChatRole, Intent } from './types'

const EXPLANATORY_PATTERNS = [
  /^what is\b/,
  /^what are\b/,
  /^why is\b/,
  /^why are\b/,
  /^how does\b/,
  /^how do i\b/,
  /^how can i\b/,
  /^how to\b/,
  /^explain\b/,
  /^tell me about\b/,
  /^help me understand\b/,
  /^describe\b/,
]

/**
 * Lightweight keyword-based intent detector.
 * Structured / factual requests are routed to Prisma; explanatory questions go to AI.
 */
export function detectIntent(message: string, role: ChatRole): Intent {
  const text = message.toLowerCase().trim()

  if (!text) return 'UNKNOWN'

  // Explanatory phrasing → AI (unless overridden by stronger factual patterns below)
  const isExplanatory = EXPLANATORY_PATTERNS.some((pattern) => pattern.test(text))

  // --- Factual / database intents (checked before defaulting to AI) ---

  if (/attendance percentage|attendance rate|attendance percent|my percentage/.test(text)) {
    return 'ATTENDANCE_PERCENTAGE'
  }

  if (/absent students?|who is absent|students absent|missing students?/.test(text)) {
    return 'SHOW_ABSENT_STUDENTS'
  }

  if (
    role === 'GUARDIAN' &&
    (/child attendance|children attendance|my child'?s? attendance/.test(text) ||
      (/attendance/.test(text) && /child|children/.test(text)))
  ) {
    return 'SHOW_ATTENDANCE'
  }

  if (role === 'GUARDIAN' && /attendance alerts?|recent alerts?|late or absent/.test(text)) {
    return 'SHOW_REPORT'
  }

  if (/my classes|enrolled classes|show classes|list classes|class list|classes i am/.test(text)) {
    return 'SHOW_MY_CLASSES'
  }

  if (
    /system statistics|total students|total teachers|total classes|attendance statistics/.test(text)
  ) {
    return 'SHOW_STATISTICS'
  }

  if (/attendance report|class report|attendance summary|class summary/.test(text)) {
    return 'SHOW_REPORT'
  }

  if (
    /my attendance|show attendance|attendance record|attendance history|today'?s? attendance|today attendance|missed class|missed classes/.test(
      text
    )
  ) {
    return 'SHOW_ATTENDANCE'
  }

  if (role === 'ADMIN' && /\bstatistics\b|\bstats\b/.test(text)) {
    return 'SHOW_STATISTICS'
  }

  if (isExplanatory) {
    return 'GENERAL_HELP'
  }

  // Admin quick-action phrasing that is navigational → AI
  if (role === 'ADMIN' && /manage users|attendance analytics/.test(text)) {
    return 'GENERAL_HELP'
  }

  return 'UNKNOWN'
}

export function shouldUseDatabase(intent: Intent): boolean {
  return intent !== 'GENERAL_HELP' && intent !== 'UNKNOWN'
}
