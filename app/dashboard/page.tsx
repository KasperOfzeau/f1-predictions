import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '../../components/LogoutButton'
import Nav from '../../components/Nav'
import NextRaceCard from '../../components/NextRaceCard'
import PreviousRaceCard from '../../components/PreviousRaceCard'
import GlobalLeaderboard from '../../components/GlobalLeaderboard'
import { getNextEvent, getLastEvent, canMakePrediction } from '@/lib/services/meetings'
import { getGlobalLeaderboard } from '@/lib/services/leaderboard'
import { getPointsForPrediction } from '@/lib/services/scoring'
import Link from 'next/link'

export const metadata: Metadata = {
  title: "Dashboard",
}

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

  // Fetch pools where user is a member
  const { data: poolMemberships } = await supabase
    .from('pool_members')
    .select(`
      id,
      role,
      joined_at,
      pools (
        id,
        name,
        description,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })

  // Count members for each pool
  const poolsWithMemberCount = await Promise.all(
    (poolMemberships || []).map(async (membership: any) => {
      const { count } = await supabase
        .from('pool_members')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', membership.pools.id)

      return {
        ...membership,
        memberCount: count || 0,
      }
    })
  )

  // Get next event (race or sprint)
  const nextEvent = await getNextEvent()

  // Check if user can make predictions for this race/sprint
  const predictionAvailability = nextEvent
    ? await canMakePrediction(nextEvent.session, nextEvent.meeting.meeting_key)
    : { canPredict: false, reason: 'No upcoming race' }

  // Check if user already has a prediction for this race
  let existingPrediction = null
  if (nextEvent) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('race_id', nextEvent.meeting.id)
      .single()

    existingPrediction = data
  }

  // Get global leaderboard
  const leaderboard = await getGlobalLeaderboard(5)

  // Last (previous) event for previous race card
  const lastEvent = await getLastEvent()
  let previousPrediction: typeof existingPrediction = null
  let previousPoints: number | null = null
  if (lastEvent) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('race_id', lastEvent.meeting.id)
      .single()

    previousPrediction = data ?? null
    previousPoints = await getPointsForPrediction(previousPrediction, lastEvent.session.session_key)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Profile & Next Race */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-black">
                  Welcome, {profile?.username || 'User'}!
                </h2>
                <div className="space-y-2 text-gray-600 text-sm">
                  <p>{profile?.full_name}</p>
                  <p>{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Link
                    href="/settings"
                    className="text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Edit Profile
                  </Link>
                  <LogoutButton />
                </div>
              </div>

              {/* Next Event Card */}
              {nextEvent && (
                <NextRaceCard
                  nextEvent={nextEvent}
                  predictionAvailability={predictionAvailability}
                  hasPrediction={!!existingPrediction}
                />
              )}

              {/* Previous Race Card */}
              {lastEvent && (
                <PreviousRaceCard
                  lastEvent={lastEvent}
                  hasPrediction={!!previousPrediction}
                  points={previousPoints}
                  prediction={previousPrediction}
                />
              )}
            </div>

            {/* Right Column - Pools & Leaderboard */}
            <div className="lg:col-span-2 space-y-6">
              {/* My Pools */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-black">My pools</h3>
                  {poolsWithMemberCount && poolsWithMemberCount.length > 0 && (
                    <Link
                      href="/pools/create"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Create pool
                    </Link>
                  )}
                </div>

                {!poolsWithMemberCount || poolsWithMemberCount.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You're not in any pools yet</p>
                    <Link
                      href="/pools/create"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                    >
                      Create your first pool
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {poolsWithMemberCount.map((membership: any) => (
                      <Link
                        key={membership.id}
                        href={`/pools/${membership.pools.id}`}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-semibold text-black">
                            {membership.pools.name}
                          </h4>
                          {membership.role === 'admin' && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        
                        {membership.pools.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {membership.pools.description}
                          </p>
                        )}
                        
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex gap-4 text-gray-500">
                            <span>👥 {membership.memberCount} members</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Global Leaderboard */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-xl font-bold text-black mb-6">Global leaderboard ({ new Date().getFullYear() })</h3>
                <GlobalLeaderboard entries={leaderboard} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}