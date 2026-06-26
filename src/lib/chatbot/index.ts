import type { NextRequest } from 'next/server'
// RapidAPI walnut-chatbot integration - DISABLED
// Free-text chatbot functionality removed; only quick-action buttons are now supported.
// import { askWalnutChatbot } from './aiProvider'
import { resolveChatAuth } from './authResolver'
import { detectIntent, shouldUseDatabase } from './intentDetector'
import { handleDatabaseIntent } from './queryHandlers'
import type { ChatbotResponse, Intent } from './types'

export async function processChatMessage(
  request: NextRequest,
  message: string
): Promise<ChatbotResponse> {
  const auth = await resolveChatAuth(request)
  if (!auth) {
    throw new Error('Unauthorized. Please log in to use the assistant.')
  }

  const intent: Intent = detectIntent(message, auth.role)
  const timestamp = new Date().toISOString()

  // All quick-action requests use database queries only
  const answer = await handleDatabaseIntent(intent, auth, message)
  return { answer, source: 'database', intent, timestamp }

  // AI fallback disabled - only quick-action buttons supported
  /*
  // Explanatory / unknown → Walnut AI with role-aware context
  const answer = await askWalnutChatbot(message, auth.role)
  return {
    answer,
    source: 'ai',
    intent: intent === 'UNKNOWN' ? 'GENERAL_HELP' : intent,
    timestamp,
  }
  */
}
