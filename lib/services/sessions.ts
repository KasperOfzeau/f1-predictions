import { createClient } from '@/lib/supabase/server'
import type { Session } from '@/lib/types'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const F1_API_URL = 'https://api.openf1.org/v1'

const RACE_OR_SPRINT_NAMES = ['Race', 'Sprint'] as const
const RELEVANT_SESSION_NAMES = ['Race', 'Sprint', 'Qualifying', 'Sprint Qualifying'] as const

// -----------------------------------------------------------------------------
// Public API: read sessions
// -----------------------------------------------------------------------------

export async function getSessionsForMeeting(meetingKey: number): Promise<Session[]> {
  const supabase = await createClient()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', meetingKey)
    .in('session_name', [...RELEVANT_SESSION_NAMES])
    .order('date_start', { ascending: true })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
  return sessions ?? []
}

export async function getQualifyingForMeeting(meetingKey: number): Promise<Session[]> {
  const supabase = await createClient()
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', meetingKey)
    .in('session_name', ['Qualifying', 'Sprint Qualifying'])
    .order('date_start', { ascending: true })

  if (error) {
    console.error('Error fetching qualifying sessions:', error)
    return []
  }
  return sessions ?? []
}

// -----------------------------------------------------------------------------
// Helpers for getNextEvent (used by meetings.ts)
// -----------------------------------------------------------------------------

export async function ensureSessionsSyncedForMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meetingKey: number
): Promise<void> {
  const { data: existing } = await supabase
    .from('sessions')
    .select('session_key')
    .eq('meeting_key', meetingKey)
    .in('session_name', [...RACE_OR_SPRINT_NAMES])
    .limit(1)

  if (!existing?.length) {
    console.log(`No sessions found for meeting ${meetingKey}, syncing...`)
    await syncSessionsForMeeting(supabase, meetingKey)
  }
}

export async function getNextRaceOrSprintForMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meetingKey: number,
  now: string
): Promise<Session | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', meetingKey)
    .in('session_name', [...RACE_OR_SPRINT_NAMES])
    .gte('date_start', now)
    .order('date_start', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Error fetching next session:', error)
    return null
  }
  return data
}

// -----------------------------------------------------------------------------
// Sync: OpenF1 API → DB
// -----------------------------------------------------------------------------

export async function syncSessionsForMeeting(
  supabase: Awaited<ReturnType<typeof createClient>>,
  meetingKey: number
): Promise<void> {
  const res = await fetch(`${F1_API_URL}/sessions?meeting_key=${meetingKey}`)
  if (!res.ok) throw new Error(`Sessions API request failed: ${res.statusText}`)

  const sessions = await res.json()
  const relevant = sessions.filter((s: { session_name: string }) =>
    RELEVANT_SESSION_NAMES.includes(s.session_name as (typeof RELEVANT_SESSION_NAMES)[number])
  )

  if (!relevant.length) {
    console.log(`No race/sprint/qualifying sessions found for meeting ${meetingKey}`)
    return
  }

  const rows = relevant.map((s: Record<string, unknown>) => ({
    session_key: s.session_key,
    session_type: s.session_type,
    session_name: s.session_name,
    date_start: s.date_start,
    date_end: s.date_end,
    meeting_key: s.meeting_key,
    circuit_key: s.circuit_key,
    circuit_short_name: s.circuit_short_name,
    country_key: s.country_key,
    country_code: s.country_code,
    country_name: s.country_name,
    location: s.location,
    gmt_offset: s.gmt_offset,
    year: s.year,
  }))

  const { error } = await supabase.from('sessions').upsert(rows, {
    onConflict: 'session_key',
    ignoreDuplicates: false,
  })
  if (error) throw error
  console.log(`✓ Synced ${rows.length} sessions for meeting ${meetingKey}`)
}
