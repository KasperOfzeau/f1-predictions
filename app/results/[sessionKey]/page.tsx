import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import ResultPageContent from '@/components/ResultPageContent'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPointsForPrediction } from '@/lib/services/scoring'
import { getQualifyingForMeeting } from '@/lib/services/sessions'
import { createClient } from '@/lib/supabase/server'

interface PageProps {
  params: Promise<{ sessionKey: string }>
  searchParams: Promise<{ user?: string }>
}

type ProfileSummary = {
  id: string
  username: string | null
  avatar_url: string | null
}

export const metadata: Metadata = {
  title: 'Result | The Prediction Paddock',
  description: 'View the latest race result and compare it to a saved prediction.',
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  const [{ sessionKey: sessionKeyParam }, { user: userParam }] = await Promise.all([params, searchParams])
  const sessionKey = Number(sessionKeyParam)

  if (!Number.isInteger(sessionKey)) {
    notFound()
  }

  const supabase = await createClient()
  const admin = createAdminClient()
  const normalizedUsername = userParam?.trim().replace(/^@+/, '').toLowerCase() ?? null

  const [
    { data: { user: currentUser } },
    { data: session },
  ] = await Promise.all([
    supabase.auth.getUser(),
    admin
      .from('sessions')
      .select('*')
      .eq('session_key', sessionKey)
      .maybeSingle(),
  ])

  if (!session) {
    notFound()
  }

  const { data: meeting } = await admin
    .from('meetings')
    .select('*')
    .eq('meeting_key', session.meeting_key)
    .maybeSingle()

  if (!meeting) {
    notFound()
  }

  let profile: ProfileSummary
  if (normalizedUsername) {
    const { data } = await admin
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('username', normalizedUsername)
      .maybeSingle()

    if (!data) {
      notFound()
    }

    profile = data
  } else {
    if (!currentUser) {
      redirect('/login')
    }

    const { data } = await admin
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', currentUser.id)
      .maybeSingle()

    profile = {
      id: currentUser.id,
      username: data?.username ?? null,
      avatar_url: data?.avatar_url ?? null,
    }
  }

  const isOwnProfile = !!currentUser && currentUser.id === profile.id
  const { data: prediction } = await admin
    .from('predictions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('session_key', session.session_key)
    .maybeSingle()

  const qualifyingSessions = await getQualifyingForMeeting(meeting.meeting_key)
  const qualifyingName = session.session_name === 'Sprint'
    ? 'Sprint Qualifying'
    : 'Qualifying'
  const qualifyingSession = qualifyingSessions.find((item) => item.session_name === qualifyingName)
    ?? qualifyingSessions[0]
    ?? null
  const points = await getPointsForPrediction(prediction ?? null, session.session_key, admin)

  const sessionDate = new Date(session.date_start).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const backHref = normalizedUsername
    ? `/profile/${normalizedUsername}`
    : '/predictions'

  return (
    <div className="min-h-screen bg-carbon-black">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-12 sm:px-6 sm:pt-8 sm:pb-16">
        <ResultPageContent
          backHref={backHref}
          backLabel={normalizedUsername ? 'Back to profile' : 'Back to predictions'}
          sessionLabel={session.session_name}
          meetingName={meeting.meeting_name}
          sessionDate={sessionDate}
          circuitImage={meeting.circuit_image}
          sessionKey={session.session_key}
          meetingKey={meeting.meeting_key}
          qualifyingSessionKey={qualifyingSession?.session_key ?? null}
          prediction={prediction ?? null}
          points={points}
          sharerName={profile.username}
          sharerAvatarUrl={profile.avatar_url}
          allowShare={isOwnProfile}
        />
      </main>
    </div>
  )
}
