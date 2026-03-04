import type { Metadata } from 'next'
import type { Prediction } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import Nav from '@/components/Nav'
import GlobalLeaderboard from '@/components/GlobalLeaderboard'
import { getNextEvent, getNextEventFromApi, getLastEventForPublic, canMakePrediction } from '@/lib/services/meetings'
import { getQualifyingForMeeting } from '@/lib/services/sessions'
import { getGlobalLeaderboard } from '@/lib/services/leaderboard'
import { getPointsForPrediction } from '@/lib/services/scoring'
import PreviousRaceCard from '@/components/PreviousRaceCard'
import HomeHero from '@/components/HomeHero'

export const metadata: Metadata = {
  title: "Home",
  description: "Predict F1 race results and compete with your friends in pools",
}

function getDaysToGo(dateStart: string): number {
  const start = new Date(dateStart)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diffMs = start.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // When not logged in, use API only to avoid RLS on meetings/sessions (no DB sync).
  const nextEvent = user ? await getNextEvent() : await getNextEventFromApi()
  const lastEvent = await getLastEventForPublic()

  // Global leaderboard (top 5). Uses admin client so it works on public home too.
  let leaderboard: Awaited<ReturnType<typeof getGlobalLeaderboard>> = []
  try {
    leaderboard = await getGlobalLeaderboard(5)
  } catch (e) {
    console.error('Global leaderboard:', e)
  }

  // Fetch user's pools with member count (only when logged in)
  let poolsWithMemberCount: Array<{
    id: string
    role: string
    joined_at: string
    pools: { id: string; name: string; description: string | null; created_at: string }
    memberCount: number
  }> = []
  if (user) {
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

    poolsWithMemberCount = await Promise.all(
      (poolMemberships || []).map(async (membership: any) => {
        const { count } = await supabase
          .from('pool_members')
          .select('*', { count: 'exact', head: true })
          .eq('pool_id', membership.pools.id)
        return {
          ...membership,
          memberCount: count ?? 0,
        }
      })
    )
  }

  // When logged in: prediction availability and existing prediction for next race (hero button + modal)
  let nextEventPredictionAvailability: { canPredict: boolean; reason?: string } = { canPredict: false, reason: 'No upcoming race' }
  let nextEventHasPrediction = false
  if (user && nextEvent) {
    nextEventPredictionAvailability = await canMakePrediction(nextEvent.session, nextEvent.meeting.meeting_key)
    const { data: nextPred } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', user.id)
      .eq('race_id', nextEvent.meeting.id)
      .single()
    nextEventHasPrediction = !!nextPred
  }

  // When logged in: check if user has a prediction for the last race and get points
  let previousPrediction: Prediction | null = null
  let previousPoints: number | null = null
  if (user && lastEvent) {
    const { data } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('race_id', lastEvent.meeting.id)
      .single()
    previousPrediction = data ?? null
    previousPoints = await getPointsForPrediction(previousPrediction, lastEvent.session.session_key)
  }

  // Qualifying session key voor drivers in result modal (race weekend = qualifying session voor driverlijst)
  let qualifyingSessionKey: number | null = null
  if (lastEvent) {
    const qualifyingSessions = await getQualifyingForMeeting(lastEvent.meeting.meeting_key)
    const qualifyingSession = qualifyingSessions.find((s) => s.session_name === 'Qualifying')
      ?? qualifyingSessions[0] ?? null
    qualifyingSessionKey = qualifyingSession?.session_key ?? null
  }

  return (
    <div className="min-h-112 sm:min-h-128 md:min-h-144 bg-carbon-black">
      <Nav />
      <main>
          {nextEvent ? (
            <HomeHero
              nextEvent={nextEvent}
              isLoggedIn={!!user}
              predictionAvailability={nextEventPredictionAvailability}
              hasPrediction={nextEventHasPrediction}
              daysToGo={getDaysToGo(nextEvent.session.date_start)}
            />
          ) : null}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 py-16">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <h3 className="text-2xl font-semibold text-white mb-4">My pools</h3>
              {user ? (
                <div className="space-y-3">
                  {poolsWithMemberCount.length === 0 ? (
                    <p className="text-white/70 text-sm text-center">
                      <Link href="/pools/create" className="text-f1-red hover:underline">Maak een pool</Link> of vraag een uitnodiging.
                    </p>
                  ) : (
                    poolsWithMemberCount.map((membership) => (
                      <Link
                        key={membership.id}
                        href={`/pools/${membership.pools.id}`}
                        className="block border border-white/10 rounded-lg p-3 hover:border-f1-red hover:bg-white/5 transition-all text-left"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-base font-semibold text-white truncate">
                            {membership.pools.name}
                          </h4>
                          {membership.role === 'admin' && (
                            <span className="text-xs bg-f1-red/20 text-f1-red px-2 py-0.5 rounded shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-2">👥 {membership.memberCount} members</p>
                      </Link>
                    ))
                  )}
                </div>
              ) : (
                <div className="relative">
                  <div className="space-y-3 blur-xs pointer-events-none select-none opacity-60">
                    {[
                      { name: 'DTS Believers Anonymous', members: 12 },
                      { name: 'We Crashed (Into Each Other)', members: 8 },
                      { name: 'Bono My Tyres Are Gone', members: 6 },
                      { name: 'No Michael No That’s So Not Right', members: 24 },
                      { name: 'GP2 Engine Support Group', members: 15 },
                    ].map((pool, i) => (
                      <div
                        key={i}
                        className="border border-white/10 rounded-lg p-3 bg-white/5"
                      >
                        <h4 className="text-base font-semibold text-white truncate">{pool.name}</h4>
                        <p className="text-xs text-white/50 mt-2">👥 {pool.members} members</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-4">
                    <p className="text-white text-md font-bold">
                      Login or make an account to join or create pools
                    </p>
                    <div className="flex items-center gap-6">
                    <Link
                      href="/login"
                      className="px-6 py-2 rounded-full font-medium transition-colors border-4 border-f1-red text-white cursor-pointer text-center"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="px-6 py-2 rounded-full font-medium transition-colors border-4 border-f1-red text-white cursor-pointer text-center"
                    >
                      Register
                    </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 flex flex-col min-h-0">
              <h3 className="text-2xl font-semibold text-white mb-4 shrink-0">Global leaderboard</h3>
              <div className="flex-1 min-h-0 flex flex-col">
                <GlobalLeaderboard entries={leaderboard} />
              </div>
            </div>
            <PreviousRaceCard
              lastEvent={lastEvent}
              hasPrediction={!!previousPrediction}
              points={previousPoints}
              prediction={previousPrediction}
              isLoggedIn={!!user}
              qualifyingSessionKey={qualifyingSessionKey}
            />
          </section>
      </main>
    </div>
  )
}