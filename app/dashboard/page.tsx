import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '../../components/LogoutButton'
import DashboardNav from '../../components/Nav'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav username={profile?.username} />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Welcome, {profile?.username || 'User'}!
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>Name: {profile?.full_name}</p>
              <p>Email: {user.email}</p>
              <p>Account created: {new Date(user.created_at).toLocaleDateString('en-US')}</p>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Link 
                href="/settings"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Edit Profile
              </Link>
              <LogoutButton />
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-black mb-2">
              🏎️ Dashboard coming soon!
            </h3>
            <p className="text-black">
              You will soon see your pools, predictions and rankings here.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}