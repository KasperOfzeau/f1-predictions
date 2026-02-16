import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Meeting, NextEvent, PredictionAvailability, Session } from '@/lib/types'
import {
  ensureSessionsSyncedForMeeting,
  getLastRaceOrSprintForMeeting,
  getNextRaceOrSprintForMeeting,
  syncSessionsForMeeting,
} from '@/lib/services/sessions'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const F1_API_URL = 'https://api.openf1.org/v1'

// -----------------------------------------------------------------------------
// Next event & meetings (public API)
// -----------------------------------------------------------------------------

const RACE_OR_SPRINT_NAMES = ['Race', 'Sprint'] as const

/**
 * Get the next race/sprint event from the Open F1 API only (no DB).
 * Use this when the user is not logged in to avoid RLS on meetings/sessions.
 */
export async function getNextEventFromApi(): Promise<NextEvent | null> {
  const currentYear = new Date().getFullYear()
  const now = new Date().toISOString()

  const res = await fetch(`${F1_API_URL}/meetings?year=${currentYear}`)
  if (!res.ok) return null
  const apiMeetings = await res.json()
  const grandPrix = apiMeetings.filter((m: { meeting_name: string }) =>
    m.meeting_name.includes('Grand Prix')
  )
  const nextMeetingApi = grandPrix
    .filter((m: { date_start: string }) => m.date_start >= now)
    .sort((a: { date_start: string }, b: { date_start: string }) =>
      a.date_start.localeCompare(b.date_start)
    )[0]
  if (!nextMeetingApi) return null

  const sessionsRes = await fetch(
    `${F1_API_URL}/sessions?meeting_key=${nextMeetingApi.meeting_key}`
  )
  if (!sessionsRes.ok) return null
  const sessions = await sessionsRes.json()
  const nextSessionApi = sessions
    .filter(
      (s: { session_name: string }) =>
        s.session_name === 'Race' || s.session_name === 'Sprint'
    )
    .filter((s: { date_start: string }) => s.date_start >= now)
    .sort((a: { date_start: string }, b: { date_start: string }) =>
      a.date_start.localeCompare(b.date_start)
    )[0]
  if (!nextSessionApi) return null

  const meeting: Meeting = {
    id: `api-${nextMeetingApi.meeting_key}`,
    meeting_key: nextMeetingApi.meeting_key,
    meeting_name: nextMeetingApi.meeting_name,
    meeting_official_name: nextMeetingApi.meeting_official_name ?? nextMeetingApi.meeting_name,
    location: nextMeetingApi.location,
    country_key: nextMeetingApi.country_key,
    country_code: nextMeetingApi.country_code,
    country_name: nextMeetingApi.country_name,
    country_flag: nextMeetingApi.country_flag ?? null,
    circuit_key: nextMeetingApi.circuit_key,
    circuit_short_name: nextMeetingApi.circuit_short_name,
    circuit_type: nextMeetingApi.circuit_type,
    circuit_image: nextMeetingApi.circuit_image ?? null,
    gmt_offset: nextMeetingApi.gmt_offset,
    date_start: nextMeetingApi.date_start,
    date_end: nextMeetingApi.date_end,
    year: nextMeetingApi.year,
    created_at: '',
    updated_at: '',
  }
  const session: Session = {
    id: `api-${nextSessionApi.session_key}`,
    session_key: nextSessionApi.session_key,
    session_type: nextSessionApi.session_type,
    session_name: nextSessionApi.session_name,
    date_start: nextSessionApi.date_start,
    date_end: nextSessionApi.date_end,
    meeting_key: nextSessionApi.meeting_key,
    circuit_key: nextSessionApi.circuit_key,
    circuit_short_name: nextSessionApi.circuit_short_name,
    country_key: nextSessionApi.country_key,
    country_code: nextSessionApi.country_code,
    country_name: nextSessionApi.country_name,
    location: nextSessionApi.location,
    gmt_offset: nextSessionApi.gmt_offset,
    year: nextSessionApi.year,
    created_at: '',
    updated_at: '',
  }
  return { session, meeting }
}

type ApiMeeting = {
  meeting_key: number
  meeting_name: string
  meeting_official_name?: string
  location: string
  country_key: number
  country_code: string
  country_name: string
  country_flag?: string | null
  circuit_key: number
  circuit_short_name: string
  circuit_type: string
  circuit_image?: string | null
  gmt_offset: string
  date_start: string
  date_end?: string
  year: number
}

/**
 * Get the last finished race/sprint event from the Open F1 API only (no DB).
 * Use this when the user is not logged in to avoid RLS on meetings/sessions.
 * Fetches current + previous year, picks the single most recent finished meeting.
 */
export async function getLastEventFromApi(): Promise<NextEvent | null> {
  const currentYear = new Date().getFullYear()
  const now = new Date().toISOString()

  const [resCurrent, resPrevious] = await Promise.all([
    fetch(`${F1_API_URL}/meetings?year=${currentYear}`),
    fetch(`${F1_API_URL}/meetings?year=${currentYear - 1}`),
  ])

  const parseMeetings = async (res: Response): Promise<ApiMeeting[]> => {
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.filter((m: ApiMeeting) => m.meeting_name?.includes('Grand Prix'))
  }

  const [currentMeetings, previousMeetings] = await Promise.all([
    parseMeetings(resCurrent),
    parseMeetings(resPrevious),
  ])

  const finished = [...currentMeetings, ...previousMeetings].filter((m) => {
    const end = m.date_end ?? m.date_start
    return end && end < now
  })

  const lastMeetingApi = finished.sort((a, b) => {
    const endA = a.date_end ?? a.date_start ?? ''
    const endB = b.date_end ?? b.date_start ?? ''
    return endB.localeCompare(endA)
  })[0]

  if (!lastMeetingApi) return null

  const sessionsRes = await fetch(
    `${F1_API_URL}/sessions?meeting_key=${lastMeetingApi.meeting_key}`
  )
  if (!sessionsRes.ok) return null

  const sessions = await sessionsRes.json()
  if (!Array.isArray(sessions)) return null

  const raceOrSprint = sessions
    .filter(
      (s: { session_name: string }) =>
        s.session_name === 'Race' || s.session_name === 'Sprint'
    )
    .filter((s: { date_end?: string; date_start?: string }) => {
      const end = s.date_end ?? s.date_start
      return end && end < now
    })
    .sort((a: { date_end?: string; date_start?: string }, b: { date_end?: string; date_start?: string }) => {
      const endA = a.date_end ?? a.date_start ?? ''
      const endB = b.date_end ?? b.date_start ?? ''
      return endB.localeCompare(endA)
    })

  const lastSessionApi = raceOrSprint[0]
  if (!lastSessionApi) return null

  const meeting: Meeting = {
    id: `api-${lastMeetingApi.meeting_key}`,
    meeting_key: lastMeetingApi.meeting_key,
    meeting_name: lastMeetingApi.meeting_name,
    meeting_official_name: lastMeetingApi.meeting_official_name ?? lastMeetingApi.meeting_name,
    location: lastMeetingApi.location,
    country_key: lastMeetingApi.country_key,
    country_code: lastMeetingApi.country_code,
    country_name: lastMeetingApi.country_name,
    country_flag: lastMeetingApi.country_flag ?? null,
    circuit_key: lastMeetingApi.circuit_key,
    circuit_short_name: lastMeetingApi.circuit_short_name,
    circuit_type: lastMeetingApi.circuit_type,
    circuit_image: lastMeetingApi.circuit_image ?? null,
    gmt_offset: lastMeetingApi.gmt_offset,
    date_start: lastMeetingApi.date_start,
    date_end: lastMeetingApi.date_end ?? lastMeetingApi.date_start,
    year: lastMeetingApi.year,
    created_at: '',
    updated_at: '',
  }
  const session: Session = {
    id: `api-${lastSessionApi.session_key}`,
    session_key: lastSessionApi.session_key,
    session_type: lastSessionApi.session_type,
    session_name: lastSessionApi.session_name,
    date_start: lastSessionApi.date_start,
    date_end: lastSessionApi.date_end ?? lastSessionApi.date_start,
    meeting_key: lastSessionApi.meeting_key,
    circuit_key: lastSessionApi.circuit_key,
    circuit_short_name: lastSessionApi.circuit_short_name,
    country_key: lastSessionApi.country_key,
    country_code: lastSessionApi.country_code,
    country_name: lastSessionApi.country_name,
    location: lastSessionApi.location,
    gmt_offset: lastSessionApi.gmt_offset,
    year: lastSessionApi.year,
    created_at: '',
    updated_at: '',
  }
  return { session, meeting }
}

export async function getNextEvent(): Promise<NextEvent | null> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const now = new Date().toISOString()

  const hasMeetingsThisYear = await ensureMeetingsSynced(supabase, currentYear)
  if (!hasMeetingsThisYear) return null

  const nextMeeting = await getNextUpcomingMeeting(supabase, currentYear, now)
  if (!nextMeeting) return null

  await ensureSessionsSyncedForMeeting(supabase, nextMeeting.meeting_key)

  const nextSession = await getNextRaceOrSprintForMeeting(
    supabase,
    nextMeeting.meeting_key,
    now
  )
  if (!nextSession) return null

  return { session: nextSession, meeting: nextMeeting }
}

/**
 * Get the last finished race or sprint event (for "previous race" card).
 * Looks in current year first, then previous year (e.g. at start of new season).
 */
export async function getLastEvent(): Promise<NextEvent | null> {
  const supabase = await createClient()
  return getLastEventWithClient(supabase)
}

/**
 * Get the last finished race/sprint from the database using admin client.
 * Use on the public home page so it works for everyone (no RLS, no dependency on external API).
 */
export async function getLastEventForPublic(): Promise<NextEvent | null> {
  const supabase = createAdminClient()
  return getLastEventWithClient(supabase)
}

async function getLastEventWithClient(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<NextEvent | null> {
  const currentYear = new Date().getFullYear()
  const now = new Date().toISOString()

  await ensureMeetingsSynced(supabase, currentYear)

  let lastMeeting = await getLastFinishedMeeting(supabase, currentYear, now)
  if (!lastMeeting) {
    const previousYear = currentYear - 1
    await ensureMeetingsSynced(supabase, previousYear)
    lastMeeting = await getLastFinishedMeeting(supabase, previousYear, now)
  }
  if (!lastMeeting) return null

  await ensureSessionsSyncedForMeeting(supabase, lastMeeting.meeting_key)

  const lastSession = await getLastRaceOrSprintForMeeting(
    supabase,
    lastMeeting.meeting_key,
    now
  )
  if (!lastSession) return null

  return { session: lastSession, meeting: lastMeeting }
}

export async function getAllMeetings(year: number): Promise<Meeting[]> {
  const supabase = await createClient()
  const { data: meetings, error } = await supabase
    .from('meetings')
    .select('*')
    .eq('year', year)
    .order('date_start', { ascending: true })

  if (error) {
    console.error('Error fetching meetings:', error)
    return []
  }
  return meetings ?? []
}

/**
 * Returns true if the first race weekend of the given year has not started yet.
 * Used to show the season predictions block on the dashboard.
 */
export async function isBeforeFirstRaceWeekend(year?: number): Promise<boolean> {
  const supabase = await createClient()
  const currentYear = year ?? new Date().getFullYear()
  const now = new Date()

  await ensureMeetingsSynced(supabase, currentYear)

  const { data: firstMeeting } = await supabase
    .from('meetings')
    .select('date_start')
    .eq('year', currentYear)
    .order('date_start', { ascending: true })
    .limit(1)
    .single()

  if (!firstMeeting?.date_start) return false
  return new Date(firstMeeting.date_start) > now
}

// -----------------------------------------------------------------------------
// Prediction availability (public API; server-only)
// -----------------------------------------------------------------------------

/**
 * Check if a prediction can be made for this race/sprint.
 * Requires: session in the future, qualifying already finished, starting grid available from API.
 */
export async function canMakePrediction(
  session: Session,
  meetingKey: number
): Promise<PredictionAvailability> {
  const supabase = await createClient()
  const now = new Date()
  const raceStart = new Date(session.date_start)

  if (raceStart <= now) {
    return { canPredict: false, reason: 'Race has started' }
  }

  const qualifyingName = session.session_name === 'Sprint' ? 'Sprint Qualifying' : 'Qualifying'
  const { data: qualifyingSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', meetingKey)
    .eq('session_name', qualifyingName)
    .single()

  if (!qualifyingSession) {
    return { canPredict: false, reason: 'Qualifying session not found' }
  }

  if (new Date(qualifyingSession.date_end) > now) {
    return { canPredict: false, reason: 'Qualifying not yet happened' }
  }

  const res = await fetch(
    `${F1_API_URL}/starting_grid?session_key=${qualifyingSession.session_key}&position<=1`
  )
  if (!res.ok) return { canPredict: false, reason: 'Grid data not available' }

  const grid = await res.json()
  const hasGrid = Array.isArray(grid) && grid.length > 0
  return hasGrid
    ? { canPredict: true }
    : { canPredict: false, reason: 'Grid data not available' }
}

// -----------------------------------------------------------------------------
// Sync: OpenF1 API → Supabase (public helper for setup/testing)
// -----------------------------------------------------------------------------

/**
 * Sync all meetings and sessions for a year. Use only for setup/testing.
 */
export async function syncAllMeetingsAndSessions(year: number): Promise<void> {
  const supabase = await createClient()
  await syncAllMeetings(supabase, year)

  const { data: meetings } = await supabase
    .from('meetings')
    .select('meeting_key')
    .eq('year', year)

  if (!meetings?.length) {
    console.log('No meetings to sync sessions for')
    return
  }

  for (const meeting of meetings) {
    await syncSessionsForMeeting(supabase, meeting.meeting_key)
  }
  console.log(`✓ Complete sync finished for ${year}`)
}

// -----------------------------------------------------------------------------
// Internal helpers (next event flow)
// -----------------------------------------------------------------------------

async function ensureMeetingsSynced(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('meetings')
    .select('meeting_key')
    .eq('year', year)
    .limit(1)

  if (!existing?.length) {
    console.log('No meetings found for this year, syncing all meetings...')
    await syncAllMeetings(supabase, year)
  }
  return true
}

async function getNextUpcomingMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number,
  now: string
) {
  const { data } = await supabase
    .from('meetings')
    .select('*')
    .eq('year', year)
    .gte('date_start', now)
    .order('date_start', { ascending: true })
    .limit(1)
    .single()

  if (!data) console.log('No upcoming meetings found')
  return data
}

async function getLastFinishedMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number,
  now: string
) {
  const { data } = await supabase
    .from('meetings')
    .select('*')
    .eq('year', year)
    .lt('date_end', now)
    .order('date_end', { ascending: false })
    .limit(1)
    .single()

  return data ?? null
}

// -----------------------------------------------------------------------------
// Internal sync (OpenF1 → DB)
// -----------------------------------------------------------------------------

async function syncAllMeetings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number
): Promise<void> {
  const res = await fetch(`${F1_API_URL}/meetings?year=${year}`)
  if (!res.ok) throw new Error(`Meetings API request failed: ${res.statusText}`)

  const apiMeetings = await res.json()
  const grandPrixMeetings = apiMeetings.filter((m: { meeting_name: string }) =>
    m.meeting_name.includes('Grand Prix')
  )

  const rows = grandPrixMeetings.map((m: Record<string, unknown>) => ({
    meeting_key: m.meeting_key,
    meeting_name: m.meeting_name,
    meeting_official_name: m.meeting_official_name,
    location: m.location,
    country_key: m.country_key,
    country_code: m.country_code,
    country_name: m.country_name,
    country_flag: m.country_flag,
    circuit_key: m.circuit_key,
    circuit_short_name: m.circuit_short_name,
    circuit_type: m.circuit_type,
    circuit_image: m.circuit_image,
    gmt_offset: m.gmt_offset,
    date_start: m.date_start,
    date_end: m.date_end,
    year: m.year,
  }))

  const { error } = await supabase.from('meetings').upsert(rows, {
    onConflict: 'meeting_key',
    ignoreDuplicates: false,
  })
  if (error) throw error
  console.log(`✓ Synced ${rows.length} meetings for ${year}`)
}
