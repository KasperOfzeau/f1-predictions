import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreatePoolForm from '@/components/CreatePoolForm'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: "Create Pool",
}

export default async function CreatePoolPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6">Create new pool</h2>
            <CreatePoolForm />
          </div>
        </div>
      </main>
    </div>
  )
}