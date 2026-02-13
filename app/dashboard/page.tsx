import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '../../components/LogoutButton'

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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-[#ED1131]">F1 Predictions</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                @{profile?.username || 'user'}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-black">
              Welcome, {profile?.full_name || 'User'}!
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>Username: @{profile?.username}</p>
              <p>Email: {user.email}</p>
              <p>Account created: {new Date(user.created_at).toLocaleDateString('en-US')}</p>
            </div>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🏎️ Dashboard coming soon!
            </h3>
            <p className="text-blue-700">
              You will soon see your pools, predictions and rankings here.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}