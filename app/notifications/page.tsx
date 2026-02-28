import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import NotificationsList from '@/components/NotificationsList'

export const metadata: Metadata = {
  title: "Notifications",
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch all notifications (unread first)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('read', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold mb-6 text-white">Pool notifications</h1>

          {!notifications || notifications.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🔔</div>
              <p className="text-gray-600 mb-2">No notifications yet</p>
              <p className="text-sm text-gray-500">
                You'll be notified about pool invites, race reminders, and updates.
              </p>
            </div>
          ) : (
            <NotificationsList notifications={notifications} />
          )}
        </div>
      </main>
    </div>
  )
}
