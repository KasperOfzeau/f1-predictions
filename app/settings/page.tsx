import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/SettingsForm'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: "Settings",
}

export default async function SettingsPage() {
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
      <Nav />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-black">Account Settings</h2>
            <SettingsForm user={user} profile={profile} />
          </div>
        </div>
      </main>
    </div>
  )
}