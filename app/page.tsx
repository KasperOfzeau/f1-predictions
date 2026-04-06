import type { Metadata } from 'next'
import type { Prediction } from '@/lib/types'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Nav from '@/components/Nav'
import GlobalLeaderboard from '@/components/GlobalLeaderboard'
import { getNextEventForPublic, getLatestStartedEventForPublic, getLastEventForPublic, canMakePrediction, isBeforeFirstRaceWeekend } from '@/lib/services/meetings'
import { getQualifyingForMeeting } from '@/lib/services/sessions'
import { getGlobalLeaderboard } from '@/lib/services/leaderboard'
import { getPointsForPrediction } from '@/lib/services/scoring'
import PreviousRaceCard from '@/components/PreviousRaceCard'
import HomeHero from '@/components/HomeHero'
import SeasonPredictionsBlock from '@/components/SeasonPredictionsBlock'
import DiscordJoinBlock from '@/components/DiscordJoinBlock'
import ExpansionRoadmapBlock from '@/components/ExpansionRoadmapBlock'
import FaqBlock from '@/components/FaqBlock'

type PoolInfo = { id: string; name: string; description: string | null; created_at: string }
type PoolMembership = {
  id: string
  role: string
  joined_at: string
  pools: PoolInfo | PoolInfo[] | null
}

export const metadata: Metadata = {
  title: "The Prediction Paddock",
  description: "Predict F1 race results and compete with your friends in pools",
}

const getCachedNextEventForPublic = unstable_cache(
  async () => getNextEventForPublic(),
  ['home-next-event-public'],
  { revalidate: 60 }
)

const getCachedLatestStartedEventForPublic = unstable_cache(
  async () => getLatestStartedEventForPublic(),
  ['home-latest-started-event-public'],
  { revalidate: 60 }
)

const getCachedLastEventForPublic = unstable_cache(
  async (before?: string) => getLastEventForPublic(before),
  ['home-last-event-public'],
  { revalidate: 60 }
)

const getCachedGlobalLeaderboard = unstable_cache(
  async (limit: number) => getGlobalLeaderboard(limit),
  ['global-leaderboard'],
  { revalidate: 60 }
)

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch independent, read-heavy data in parallel.
  const nextEventPromise = getCachedNextEventForPublic()
  const latestStartedEventPromise = getCachedLatestStartedEventForPublic()
  const lastFinishedEventPromise = getCachedLastEventForPublic()
  const leaderboardPromise = getCachedGlobalLeaderboard(5).catch((e) => {
    console.error('Global leaderboard:', e)
    return []
  })
  const [nextEvent, latestStartedEvent, lastFinishedEvent, leaderboard] = await Promise.all([
    nextEventPromise,
    latestStartedEventPromise,
    lastFinishedEventPromise,
    leaderboardPromise,
  ])

  const now = new Date()
  const latestStartedEventIsOngoing = latestStartedEvent
    ? new Date(latestStartedEvent.session.date_start) <= now
      && new Date(latestStartedEvent.session.date_end) > now
    : false

  const heroEvent = latestStartedEventIsOngoing
    ? latestStartedEvent
    : nextEvent ?? latestStartedEvent

  let previousEvent = lastFinishedEvent
  if (
    heroEvent
    && lastFinishedEvent
    && heroEvent.session.session_key === lastFinishedEvent.session.session_key
  ) {
    previousEvent = await getCachedLastEventForPublic(heroEvent.session.date_end)
  }

  // Fetch user's pools with member count (only when logged in)
  let poolsWithMemberCount: Array<{
    id: string
    role: string
    joined_at: string
    pools: PoolInfo
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

    const normalizedMemberships = ((poolMemberships || []) as PoolMembership[])
      .map((membership) => ({
        ...membership,
        pools: Array.isArray(membership.pools) ? membership.pools[0] : membership.pools,
      }))
      .filter((membership): membership is Omit<PoolMembership, 'pools'> & { pools: PoolInfo } => !!membership.pools?.id)

    const poolIds = normalizedMemberships.map((membership) => membership.pools.id)
    const { data: poolMembers } = poolIds.length > 0
      ? await supabase
        .from('pool_members')
        .select('pool_id')
        .in('pool_id', poolIds)
      : { data: [] as Array<{ pool_id: string }> }

    const memberCountByPoolId = (poolMembers || []).reduce<Record<string, number>>((acc, row) => {
      acc[row.pool_id] = (acc[row.pool_id] ?? 0) + 1
      return acc
    }, {})

    poolsWithMemberCount = normalizedMemberships.map((membership) => ({
      ...membership,
      memberCount: memberCountByPoolId[membership.pools.id] ?? 0,
    }))
  }

  // When logged in: prediction availability and existing prediction for next race (hero button + modal)
  let nextEventPredictionAvailability: { canPredict: boolean; reason?: string } = { canPredict: false, reason: 'No upcoming race' }
  let nextEventHasPrediction = false
  if (user && heroEvent) {
    const [predictionAvailability, { data: nextPred }] = await Promise.all([
      canMakePrediction(heroEvent.session, heroEvent.meeting.meeting_key),
      supabase
        .from('predictions')
        .select('id')
        .eq('user_id', user.id)
        .eq('session_key', heroEvent.session.session_key)
        .single(),
    ])
    nextEventPredictionAvailability = predictionAvailability
    nextEventHasPrediction = !!nextPred
  }

  // When logged in: check if user has a prediction for the last race and get points
  let previousPrediction: Prediction | null = null
  let previousPoints: number | null = null
  let currentUsername: string | null = null
  let currentUserAvatarUrl: string | null = null
  if (user && previousEvent) {
    const [{ data }, { data: profile }] = await Promise.all([
      supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_key', previousEvent.session.session_key)
        .single(),
      supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
    ])
    previousPrediction = data ?? null
    previousPoints = await getPointsForPrediction(previousPrediction, previousEvent.session.session_key)
    currentUsername = profile?.username ?? null
    currentUserAvatarUrl = profile?.avatar_url ?? null
  }

  // Qualifying session key voor drivers in result modal (race weekend = qualifying session voor driverlijst)
  let qualifyingSessionKey: number | null = null
  if (previousEvent) {
    const qualifyingSessions = await getQualifyingForMeeting(previousEvent.meeting.meeting_key)
    const qualifyingName = previousEvent.session.session_name === 'Sprint'
      ? 'Sprint Qualifying'
      : 'Qualifying'
    const qualifyingSession = qualifyingSessions.find((s) => s.session_name === qualifyingName)
      ?? qualifyingSessions[0] ?? null
    qualifyingSessionKey = qualifyingSession?.session_key ?? null
  }

  // Season predictions block: alleen tonen voor ingelogde gebruikers vóór eerste raceweekend
  // Not cached: isBeforeFirstRaceWeekend uses Supabase server client (cookies)
  const showSeasonPredictionsBlock = user ? await isBeforeFirstRaceWeekend() : false

  return (
    <div className="min-h-112 sm:min-h-128 md:min-h-144 bg-carbon-black">
      <Nav />
      <main>
          {heroEvent ? (
            <HomeHero
              nextEvent={heroEvent}
              isLoggedIn={!!user}
              predictionAvailability={nextEventPredictionAvailability}
              hasPrediction={nextEventHasPrediction}
            />
          ) : null}

          <section className="max-w-7xl mx-auto px-6 pt-8 pb-4 flex flex-col gap-6">
            {showSeasonPredictionsBlock && (
              <SeasonPredictionsBlock show={true} />
            )}
            <DiscordJoinBlock />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto px-6 pt-6 pb-6">
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="flex justify-between items-center gap-3 mb-4">
                <h3 className="text-2xl font-semibold text-white">My pools</h3>
                {user ? (
                  <Link
                    href="/pools/create"
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-f1-red hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    New pool
                  </Link>
                ) : null}
              </div>
              {user ? (
                <div className="space-y-3">
                  {poolsWithMemberCount.length === 0 ? (
                    <p className="text-white/70 text-sm text-center">
                      <Link href="/pools/create" className="text-f1-red hover:underline">Create a pool</Link> or ask for an invitation.
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
                  <div className="space-y-3 blur-[2px] pointer-events-none select-none opacity-60">
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
              lastEvent={previousEvent}
              hasPrediction={!!previousPrediction}
              points={previousPoints}
              prediction={previousPrediction}
              isLoggedIn={!!user}
              qualifyingSessionKey={qualifyingSessionKey}
              sharerName={currentUsername}
              sharerAvatarUrl={currentUserAvatarUrl}
            />
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <FaqBlock />
          </section>

          <section className="max-w-7xl mx-auto px-6 pb-16">
            <ExpansionRoadmapBlock />
          </section>
      </main>
    </div>
  )
}