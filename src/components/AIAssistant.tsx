'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { getQuickActions } from '@/lib/chatbot/roleContext'
import type { ChatRole, ResponseSource } from '@/lib/chatbot/types'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  source?: ResponseSource
  timestamp: string
}

interface AIAssistantProps {
  role: ChatRole
}

const WELCOME: Record<ChatRole, string> = {
  STUDENT:
    'Hi! I can show your real attendance data, classes, and percentage — or explain how the system works.',
  TEACHER:
    'Hi! Ask for your classes, attendance reports, or absent students. I can also explain dashboard features.',
  GUARDIAN:
    'Hi! I can show your child\'s attendance and alerts from the database, or explain how notifications work.',
  ADMIN:
    'Hi! Ask for system statistics from the database, or get help managing users and analytics.',
}

function storageKey(role: ChatRole) {
  return `ai-assistant-history-${role}`
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function AIAssistant({ role }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hydrated, setHydrated] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickActions = getQuickActions(role)

  // Restore session history from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey(role))
      if (saved) {
        setMessages(JSON.parse(saved) as ChatMessage[])
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME[role],
            timestamp: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME[role],
          timestamp: new Date().toISOString(),
        },
      ])
    }
    setHydrated(true)
  }, [role])

  // Persist session history
  useEffect(() => {
    if (!hydrated || messages.length === 0) return
    try {
      sessionStorage.setItem(storageKey(role), JSON.stringify(messages.slice(-50)))
    } catch {
      // sessionStorage full or unavailable
    }
  }, [messages, role, hydrated])

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open, loading])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const sendMessage = useCallback(
    async (text: string) => {
      const message = text.trim()
      if (!message || loading) return

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setLoading(true)

      try {
        const response = await fetch('/api/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to get a response')
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.answer,
            source: data.source,
            timestamp: data.timestamp ?? new Date().toISOString(),
          },
        ])
      } catch (error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content:
              error instanceof Error
                ? error.message
                : 'Something went wrong. Please try again.',
            timestamp: new Date().toISOString(),
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const clearHistory = () => {
    const welcome: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: WELCOME[role],
      timestamp: new Date().toISOString(),
    }
    setMessages([welcome])
    sessionStorage.removeItem(storageKey(role))
  }

  if (!hydrated) return null

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] transition-all duration-300 origin-bottom-right',
          open
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        )}
      >
        <div className="flex flex-col h-[min(560px,calc(100vh-8rem))] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">AI Assistant</p>
                <p className="text-xs text-primary-foreground/80 truncate">
                  Hybrid · Database + AI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground h-8 px-2"
                onClick={clearHistory}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex flex-col',
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card border border-border text-foreground rounded-bl-md shadow-sm'
                  )}
                >
                  {message.content}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5 mt-1 px-1 text-[10px] text-muted-foreground',
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <span>{formatTime(message.timestamp)}</span>
                  {message.source && message.role === 'assistant' && (
                    <span
                      className={cn(
                        'rounded px-1 py-0.5 font-medium',
                        message.source === 'database'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                      )}
                    >
                      {message.source === 'database' ? 'Live data' : 'AI'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-card px-3.5 py-2.5 text-sm text-muted-foreground shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => sendMessage(action.message)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-border p-3 bg-card"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about attendance or the system..."
              disabled={loading}
              maxLength={500}
              className="rounded-xl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-xl"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Toggle button */}
      <Button
        onClick={() => setOpen((prev) => !prev)}
        size="lg"
        className={cn(
          'fixed bottom-4 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
          open && 'scale-95'
        )}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </>
  )
}
