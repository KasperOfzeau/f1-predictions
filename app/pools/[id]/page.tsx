import type { Metadata } from 'next'
import { cache } from 'react'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InviteUserButton from '@/components/InviteUserButton'
import PoolMembersList from '@/components/PoolMembersList'
import DeletePoolButton from '@/components/DeletePoolButton'
import Nav from '@/components/Nav'
import { getOrComputeSeasonPointsForUsers } from '@/lib/services/seasonScores'

const getPoolById = cache(async (id: string) => {
  const supabase = await createClient()
  const { data: pool } = await supabase
    .from('pools')
    .select('*')
    .eq('id', id)
    .single()
  return pool
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const pool = await getPoolById(id)

  return {
    title: pool?.name || 'Pool Details',
  }
}

export default async function PoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: { user }, error: userError }, pool] = await Promise.all([
    supabase.auth.getUser(),
    getPoolById(id),
  ])

  if (userError || !user) {
    redirect('/login')
  }

  if (!pool) {
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
    <div className="min-h-screen bg-carbon-black text-white">
      <Nav />

      <main>
        <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:py-12">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-4">
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{pool.name}</h1>
                  {pool.description && (
                    <p className="max-w-3xl text-base text-white/70 sm:text-lg">{pool.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-white/60">
                  <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                    Created {new Date(pool.created_at).toLocaleDateString('en-US')}
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2">
                    {members.length} member{members.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-3">
                  <InviteUserButton poolId={pool.id} />
                  <DeletePoolButton poolId={pool.id} poolName={pool.name} />
                </div>
              )}
            </div>
          </div>

          {membersError && (
            <div className="rounded-2xl border border-f1-red/30 bg-f1-red/10 px-4 py-3 text-sm text-red-100">
              Error loading members: {membersError.message}
            </div>
          )}

          {!currentMember && !membersError && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              You are not a member of this pool.
            </div>
          )}

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md sm:p-8">
            <div className="mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Championship standings</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Members</h2>
              </div>
            </div>
            <PoolMembersList
              members={membersSortedByScore}
              isAdmin={isAdmin}
              poolId={pool.id}
              currentUserId={user.id}
              seasonPointsByUser={seasonPointsByUser}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
