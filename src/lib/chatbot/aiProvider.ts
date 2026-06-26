import { getRoleContext } from './roleContext'
import type { ChatRole } from './types'

// RapidAPI walnut-chatbot integration - DISABLED
// Free-text chatbot functionality removed; only quick-action buttons are now supported.
// Uncomment and configure RAPIDAPI_KEY in .env if needed in the future.

/*
const WALNUT_HOST = 'walnut-chatbot.p.rapidapi.com'
const WALNUT_URL = `https://${WALNUT_HOST}/wrt_transformer`

/**
 * Calls Walnut Chatbot RapidAPI for explanatory / general-help questions only.
 * API key is read from server environment — never exposed to the client.
 *\/
export async function askWalnutChatbot(question: string, role: ChatRole): Promise<string> {
  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) {
    throw new Error('Chatbot is not configured. Set RAPIDAPI_KEY in your environment.')
  }

  const information = getRoleContext(role)
  const url = new URL(WALNUT_URL)
  url.searchParams.set('question', question.trim())
  url.searchParams.set('information', information)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': WALNUT_HOST,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error(
        'AI assistant access denied. Check your RapidAPI key and walnut-chatbot subscription.'
      )
    }
    if (response.status === 429) {
      throw new Error('AI assistant rate limit reached. Please try again shortly.')
    }
    throw new Error(`AI assistant unavailable (${response.status}).`)
  }

  const raw = await response.text()
  if (!raw.trim()) {
    return 'Sorry, I could not generate a response. Please try again.'
  }

  try {
    const json = JSON.parse(raw) as Record<string, unknown>
    const answer =
      json.answer ??
      json.response ??
      json.message ??
      json.text ??
      json.result ??
      json.output

    if (typeof answer === 'string' && answer.trim()) {
      return answer.trim()
    }
  } catch {
    // Plain-text response from Walnut API
  }

  return raw.trim()
}
*/
