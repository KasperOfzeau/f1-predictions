'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Notification } from '@/lib/types'

interface NotificationsListProps {
  notifications: Notification[]
}

export default function NotificationsList({ notifications }: NotificationsListProps) {
  const [dismissing, setDismissing] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleMarkAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    router.refresh()
  }

  const handleDismiss = async (notificationId: string) => {
    setDismissing(notificationId)

    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    setDismissing(null)
    router.refresh()
  }

  const handleMarkAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)

    router.refresh()
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pool_invite':
        return '📨'
      case 'race_reminder':
        return '🏎️'
      case 'points_update':
        return '🏆'
      default:
        return '🔔'
    }
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mark all as read
          </button>
        </div>
      )}

      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white shadow rounded-lg p-5 hover:shadow-md transition-shadow ${
            !notification.read ? 'border-l-4 border-blue-500' : ''
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              {getNotificationIcon(notification.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>

                <button
                  onClick={() => handleDismiss(notification.id)}
                  disabled={dismissing === notification.id}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Dismiss"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                {notification.link && (
                  <Link
                    href={notification.link}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                  >
                    View
                  </Link>
                )}
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
