'use client'

import { useEffect, useState, useCallback } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

type Status = 'loading' | 'unsupported' | 'denied' | 'enabled' | 'disabled'

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('loading')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    if (Notification.permission === 'denied') {
      setStatus('denied')
      return
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      if (!registration) {
        setStatus('disabled')
        return
      }
      const subscription = await registration.pushManager.getSubscription()
      setStatus(subscription ? 'enabled' : 'disabled')
    } catch {
      setStatus('disabled')
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  async function subscribe() {
    setBusy(true)
    setError(null)
    try {
      if (!window.isSecureContext) {
        throw new Error('Push notifications require HTTPS (or localhost).')
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        return
      }

      await navigator.serviceWorker.register('/sw.js')
      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (!res.ok) throw new Error('Server rejected subscription')
      setStatus('enabled')
    } catch (err) {
      console.error('Push subscribe failed:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Could not enable push notifications in this browser.'
      )
    } finally {
      setBusy(false)
    }
  }

  async function unsubscribe() {
    setBusy(true)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js')
      const subscription = await registration?.pushManager.getSubscription()

      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
        await subscription.unsubscribe()
      }

      setStatus('disabled')
    } catch (err) {
      console.error('Push unsubscribe failed:', err)
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="h-6 w-11 rounded-full bg-gray-200 animate-pulse" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    )
  }

  if (status === 'unsupported') {
    return (
      <p className="text-sm text-gray-500">
        Push notifications are not supported by your browser.
        On iOS, add this site to your home screen first.
      </p>
    )
  }

  if (status === 'denied') {
    return (
      <p className="text-sm text-gray-500">
        Notifications are blocked. Please enable them in your browser settings and reload this page.
      </p>
    )
  }

  const enabled = status === 'enabled'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={busy}
          onClick={enabled ? unsubscribe : subscribe}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-f1-red focus:ring-offset-2 disabled:opacity-50 ${
            enabled ? 'bg-f1-red' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700">
          {busy
            ? 'Working...'
            : enabled
              ? 'Notifications enabled'
              : 'Notifications disabled'}
        </span>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  )
}
