import { createClient } from '@/lib/supabase/server'
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
