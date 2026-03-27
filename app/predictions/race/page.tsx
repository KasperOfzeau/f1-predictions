import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Nav from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'
import { getNextEvent, canMakePrediction } from '@/lib/services/meetings'
import StartingGridPrediction from '@/components/StartingGridPrediction'
import type { Driver } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1'

function normalizeTeamName(name: string): string {
  const normalized = name.toLowerCase().trim()

  if (normalized.includes('red bull')) return 'red-bull'
  if (normalized.includes('mclaren')) return 'mclaren'
  if (normalized.includes('ferrari')) return 'ferrari'
  if (normalized.includes('mercedes')) return 'mercedes'
  if (normalized.includes('aston martin')) return 'aston-martin'
  if (normalized.includes('alpine')) return 'alpine'
  if (normalized.includes('williams')) return 'williams'
  if (normalized.includes('haas')) return 'haas'
  if (normalized.includes('sauber') || normalized.includes('kick')) return 'sauber'
  if (normalized.includes('racing bulls') || normalized === 'rb' || normalized.includes('rb f1')) return 'racing-bulls'

  return normalized
}

export const metadata: Metadata = {
  title: 'Race Prediction | The Prediction Paddock',
  description: 'Create your prediction for the next race.',
}

export default async function RacePredictionPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const nextEvent = await getNextEvent()

  if (!nextEvent) {
    return (
      <div className="bg-carbon-black">
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-white">No upcoming race</h1>
          <p className="mt-4 text-white/70">There is no upcoming race to make a prediction for.</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border-2 border-f1-red px-5 py-2 font-medium text-white transition-colors hover:bg-f1-red/20"
          >
            Back to home
          </Link>
        </main>
      </div>
    )
  }

  const { session, meeting } = nextEvent
  const availability = await canMakePrediction(session, meeting.meeting_key)

  if (!availability.canPredict) {
    return (
      <div className="bg-carbon-black">
        <Nav />
        <main className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-white">{meeting.meeting_name}</h1>
          <p className="mt-2 text-sm text-white/50">{session.session_name}</p>
          <p className="mt-6 text-white/70">{availability.reason || 'Predictions are not available yet.'}</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border-2 border-f1-red px-5 py-2 font-medium text-white transition-colors hover:bg-f1-red/20"
          >
            Back to home
          </Link>
        </main>
      </div>
    )
  }

  const driversRes = await fetch(
    `${F1_API_URL}/drivers?meeting_key=${meeting.meeting_key}`,
    { next: { revalidate: 60 } }
  )
  let drivers: Driver[] = []
  if (driversRes.ok) {
    const data: Driver[] = await driversRes.json()
    const byNumber = new Map<number, Driver>()
    data.forEach((d) => {
      if (!byNumber.has(d.driver_number)) byNumber.set(d.driver_number, d)
    })
    drivers = Array.from(byNumber.values()).sort((a, b) => a.driver_number - b.driver_number)
  }

  let constructorStandingsOrder: string[] = []
  try {
    const standingsRes = await fetch(
      `https://api.jolpi.ca/ergast/f1/${session.year}/constructorstandings/?format=json`,
      { next: { revalidate: 3600 } }
    )

    if (standingsRes.ok) {
      const standingsData = await standingsRes.json()
      const standings =
        standingsData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []

      constructorStandingsOrder = standings.map(
        (item: { Constructor?: { name?: string } }) => normalizeTeamName(item.Constructor?.name ?? '')
      )
    }
  } catch (error) {
    console.error('Error fetching constructor standings:', error)
  }

  const { data: existingPrediction } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .eq('session_key', session.session_key)
    .maybeSingle()

  return (
    <div className="bg-carbon-black flex flex-col">
      <Nav />
      <StartingGridPrediction
        drivers={drivers}
        meeting={meeting}
        session={session}
        existingPrediction={existingPrediction}
        constructorStandingsOrder={constructorStandingsOrder}
      />
    </div>
  )
}
