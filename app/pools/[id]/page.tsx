import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import InviteUserButton from '@/components/InviteUserButton'
import PoolMembersList from '@/components/PoolMembersList'
import DeletePoolButton from '@/components/DeletePoolButton'
import Nav from '@/components/Nav'
import { getOrComputeSeasonPointsForUsers } from '@/lib/services/seasonScores'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: pool } = await supabase
    .from('pools')
    .select('name')
    .eq('id', id)
    .single()

  return {
    title: pool?.name || 'Pool Details',
  }
}

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

  // Fetch pool
  const { data: pool, error: poolError } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single()

  if (poolError || !pool) {
    notFound()
  }

  // Fetch members
  const { data: membersRaw, error: membersError } = await supabase
    .from('pool_members')
    .select(`
      id,
      pool_id,
      user_id,
      role,
      joined_at,
      profiles (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('pool_id', id)
    .order('joined_at', { ascending: true })

  // Normalize: Supabase returns nested relations as arrays; PoolMembersList expects single object
  const members = membersRaw?.map((m) => ({
    id: m.id,
    pool_id: m.pool_id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    profiles: Array.isArray(m.profiles) ? m.profiles[0] : m.profiles,
  })).filter((m) => m.profiles != null) ?? []

  // Check if current user is admin
  const currentMember = members?.find(m => m.user_id === user.id)
  const isAdmin = currentMember?.role === 'admin'

  const seasonYear = new Date().getFullYear()
  const seasonPointsByUser = members.length > 0
    ? await getOrComputeSeasonPointsForUsers(members.map((m) => m.user_id), seasonYear)
    : {}

  const membersSortedByScore = [...members].sort((a, b) => {
    const ptsA = seasonPointsByUser[a.user_id] ?? 0
    const ptsB = seasonPointsByUser[b.user_id] ?? 0
    return ptsB - ptsA
  })

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Pool Header */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4 flex-col sm:flex-row gap-4">
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
              members={membersSortedByScore}
              isAdmin={isAdmin}
              poolId={pool.id}
              currentUserId={user.id}
              seasonPointsByUser={seasonPointsByUser}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
