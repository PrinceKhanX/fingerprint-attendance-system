import type { NextRequest } from 'next/server'
import { askWalnutChatbot } from './aiProvider'
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

  // Factual requests → Prisma only (never AI)
  if (shouldUseDatabase(intent)) {
    const answer = await handleDatabaseIntent(intent, auth, message)
    return { answer, source: 'database', intent, timestamp }
  }

  // Explanatory / unknown → Walnut AI with role-aware context
  const answer = await askWalnutChatbot(message, auth.role)
  return {
    answer,
    source: 'ai',
    intent: intent === 'UNKNOWN' ? 'GENERAL_HELP' : intent,
    timestamp,
  }
}
