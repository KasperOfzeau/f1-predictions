'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Nav() {
  const [username, setUsername] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    const loadUserAndNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUsername(profile.username ?? null)
        setAvatarUrl(profile.avatar_url ?? null)
        setFullName(profile.full_name ?? null)
      }

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setUnreadCount(count ?? 0)
    }

    loadUserAndNotifications()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserAndNotifications()
    })

    return () => subscription.unsubscribe()
  }, [])

  const displayLetter = fullName?.charAt(0)?.toUpperCase() || username?.charAt(0)?.toUpperCase() || '?'

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard">
              <h1 className="text-xl font-bold text-[#ED1131]">F1 Predictions</h1>
            </Link>
          </div>

          {username && (
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>

              <Link
                href="/notifications"
                className="relative text-gray-600 hover:text-gray-900 transition-colors"
                title="Notifications"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#ED1131] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0 ring-2 ring-gray-200 hover:ring-gray-300 transition-all">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                      unoptimized
                      sizes="32px"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-500">
                      {displayLetter}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">@{username}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
