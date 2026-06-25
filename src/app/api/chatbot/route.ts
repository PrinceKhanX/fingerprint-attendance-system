import { NextRequest, NextResponse } from 'next/server'
import { processChatMessage } from '@/lib/chatbot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message =
      typeof body.message === 'string'
        ? body.message.trim()
        : typeof body.question === 'string'
          ? body.question.trim()
          : ''

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message is too long (max 500 characters)' }, { status: 400 })
    }

    const result = await processChatMessage(request, message)
    return NextResponse.json(result)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Chatbot request failed'

    if (msg.includes('Unauthorized')) {
      return NextResponse.json({ error: msg }, { status: 401 })
    }
    if (msg.includes('not configured')) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }

    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
