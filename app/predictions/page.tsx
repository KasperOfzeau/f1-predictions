import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import UserPredictionsList from '@/components/UserPredictionsList'
import { getRecentPredictionsForUser } from '@/lib/services/userPredictions'
import { getNextEvent } from '@/lib/services/meetings'

export const metadata: Metadata = {
  title: 'Predictions | The Prediction Paddock',
  description: 'View all your F1 predictions.',
}

export default async function PredictionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const currentSeasonYear = new Date().getMonth() === 0
    ? new Date().getFullYear() - 1
    : new Date().getFullYear()

  const [nextEvent, { data: profile }, allPredictions, { data: seasonPrediction }] = await Promise.all([
    getNextEvent(),
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    getRecentPredictionsForUser(user.id, null, supabase),
    supabase
      .from('season_predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_year', currentSeasonYear)
      .maybeSingle(),
  ])

  let hasUpcomingRacePrediction = false
  if (nextEvent) {
    const { data: nextPrediction } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', user.id)
      .eq('session_key', nextEvent.session.session_key)
      .maybeSingle()

    hasUpcomingRacePrediction = !!nextPrediction
  }

  return (
    <div className="bg-carbon-black">
      <Nav />
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-16">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-white">My predictions</h1>
              <p className="mt-4 max-w-2xl text-white/70">
                Here you can find an overview of all your saved predictions.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/predictions/race"
                className="inline-flex rounded-full border-2 border-f1-red px-5 py-2 font-medium text-white transition-colors hover:bg-f1-red/20"
              >
                {hasUpcomingRacePrediction ? 'Edit race prediction' : 'Make race prediction'}
              </Link>
              <Link
                href="/"
                className="inline-flex rounded-full border border-white/15 px-5 py-2 font-medium text-white transition-colors hover:bg-white/8"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-white">Overview</h2>
            </div>

            <UserPredictionsList
              items={allPredictions}
              seasonPrediction={seasonPrediction ?? null}
              seasonYear={currentSeasonYear}
              isOwnProfile={true}
              sharerName={profile?.username ?? null}
              sharerAvatarUrl={profile?.avatar_url ?? null}
              theme="dark"
            />
          </div>
        </section>
      </main>
    </div>
  )
}
