import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/Nav'
import InvitesList from '@/components/InvitesList'

export const metadata: Metadata = {
  title: "Pool Invitations",
}

export default async function InvitesPage() {
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

  // Fetch pending invites with nested select
  const { data: invites, error: invitesError } = await supabase
    .from('invites')
    .select(`
      id,
      pool_id,
      from_user_id,
      to_user_id,
      status,
      created_at,
      pools (
        id,
        name,
        description
      ),
      from_profile:profiles!invites_from_user_id_fkey (
        id,
        username,
        full_name
      )
    `)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  console.log('Invites:', invites)
  console.log('Invites Error:', invitesError)

  // Normalize: Supabase returns nested relations as arrays; InvitesList expects single objects
  const normalizedInvites = invites?.map((inv) => ({
    id: inv.id,
    pool_id: inv.pool_id,
    from_user_id: inv.from_user_id,
    to_user_id: inv.to_user_id,
    status: inv.status,
    created_at: inv.created_at,
    pools: Array.isArray(inv.pools) ? inv.pools[0] : inv.pools,
    from_profile: Array.isArray(inv.from_profile) ? inv.from_profile[0] : inv.from_profile,
  })).filter((inv) => inv.pools != null && inv.from_profile != null) ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold mb-6">Pool invitations</h1>

          {invitesError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              Error: {invitesError.message}
            </div>
          )}

          {!invites || invites.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">📨</div>
              <p className="text-gray-600 mb-2">No pending invitations</p>
              <p className="text-sm text-gray-500">
                When someone invites you to a pool, it will appear here.
              </p>
            </div>
          ) : (
            <InvitesList invites={normalizedInvites} />
          )}
        </div>
      </main>
    </div>
  )
}