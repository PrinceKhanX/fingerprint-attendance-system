'use client'

import { useCallback, useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

interface PushNotificationsProps {
  role: 'GUARDIAN' | 'STUDENT'
}

export default function PushNotifications({ role }: PushNotificationsProps) {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  const subscribe = useCallback(async () => {
    setLoading(true)
    setMessage('')

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage('Notification permission denied')
        return
      }

      const keyRes = await fetch('/api/notifications/subscribe')
      const { publicKey } = await keyRes.json()

      if (!publicKey) {
        setMessage('Push notifications not configured on server')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      const json = subscription.toJSON()
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          role,
        }),
      })

      if (!res.ok) {
        setMessage('Failed to save subscription')
        return
      }

      setSubscribed(true)
      setMessage('Push notifications enabled')
    } catch (error) {
      console.error(error)
      setMessage('Could not enable push notifications')
    } finally {
      setLoading(false)
    }
  }, [role])

  if (!supported) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">Mobile alerts</p>
          <p className="text-sm text-slate-500">
            Get notified when attendance is marked late or absent
          </p>
        </div>
        <button
          onClick={subscribe}
          disabled={loading || subscribed}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-400 transition whitespace-nowrap"
        >
          {subscribed ? 'Enabled' : loading ? 'Enabling...' : 'Enable alerts'}
        </button>
      </div>
      {message && <p className="text-xs text-slate-500 mt-2">{message}</p>}
    </div>
  )
}
