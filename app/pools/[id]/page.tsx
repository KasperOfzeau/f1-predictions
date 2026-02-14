import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InviteUserButton from '@/components/InviteUserButton'
import PoolMembersList from '@/components/PoolMembersList'
import DeletePoolButton from '@/components/DeletePoolButton'
import Nav from '@/components/Nav'

export default async function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
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

  // Haal pool op
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single()

  if (poolError || !pool) {
    notFound()
  }

  // Haal members op
  const { data: members, error: membersError } = await supabase
    .from('pool_members')
    .select(`
      id,
      pool_id,
      user_id,
      role,
      points,
      joined_at,
      profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('pool_id', id)
    .order('points', { ascending: false })

  // Check of huidige user admin is
  const currentMember = members?.find(m => m.user_id === user.id)
  const isAdmin = currentMember?.role === 'admin'

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Pool Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{pool.name}</h1>
                {pool.description && (
                  <p className="text-gray-600">{pool.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Created {new Date(pool.created_at).toLocaleDateString('en-US')}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-3">
                  <InviteUserButton poolId={pool.id} />
                  <DeletePoolButton poolId={pool.id} poolName={pool.name} />
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {membersError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              Error loading members: {membersError.message}
            </div>
          )}

          {/* Not a Member Warning */}
          {!currentMember && !membersError && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
              You are not a member of this pool.
            </div>
          )}

          {/* Members List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">
              Members ({members?.length || 0})
            </h2>
            <PoolMembersList
              members={members || []}
              isAdmin={isAdmin}
              poolId={pool.id}
              currentUserId={user.id}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
