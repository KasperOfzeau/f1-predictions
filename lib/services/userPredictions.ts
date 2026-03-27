import { createClient } from '@/lib/supabase/server'
import type { Prediction } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getQualifyingForMeeting } from '@/lib/services/sessions'

export interface PredictionWithMeta {
  prediction: Prediction
  meetingName: string
  meetingKey: number
  sessionKey: number | null
  sessionName: string | null
  /** Qualifying session key – use this to fetch drivers for accurate data */
  qualifyingSessionKey: number | null
  points: number | null
  dateStart: string
}

/**
 * Fetch the last N predictions for a user with meeting info and session key for result/drivers.
 * Pass a client (e.g. admin) when the caller is unauthenticated so RLS does not block reading other users' predictions.
 */
export async function getRecentPredictionsForUser(
  userId: string,
  limit: number | null = 5,
  client?: SupabaseClient
): Promise<PredictionWithMeta[]> {
  const supabase = client ?? (await createClient())

  let query = supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .not('session_key', 'is', null)
    .order('updated_at', { ascending: false })

  if (limit != null) {
    query = query.limit(limit)
  }

  const { data: rows, error } = await query

  if (error || !rows?.length) return []

  const sessionKeys = Array.from(
    new Set(
      rows
        .map((row) => row.session_key)
        .filter((sessionKey): sessionKey is number => typeof sessionKey === 'number')
    )
  )
  const meetingIds = Array.from(new Set(rows.map((row) => row.race_id)))

  const [{ data: sessions }, { data: meetings }] = await Promise.all([
    supabase
      .from('sessions')
      .select('session_key, session_name, date_start, meeting_key')
      .in('session_key', sessionKeys),
    supabase
      .from('meetings')
      .select('id, meeting_key, meeting_name, date_start')
      .in('id', meetingIds),
  ])

  const sessionByKey = new Map(
    (sessions ?? []).map((session) => [session.session_key, session])
  )
  const meetingById = new Map(
    (meetings ?? []).map((meeting) => [meeting.id, meeting])
  )
  const meetingKeys = Array.from(
    new Set((meetings ?? []).map((meeting) => meeting.meeting_key))
  )
  const qualifyingByMeetingKey = new Map<number, Awaited<ReturnType<typeof getQualifyingForMeeting>>>()

  await Promise.all(
    meetingKeys.map(async (meetingKey) => {
      const qualifyingSessions = await getQualifyingForMeeting(meetingKey)
      qualifyingByMeetingKey.set(meetingKey, qualifyingSessions)
    })
  )

  const result: PredictionWithMeta[] = []

  for (const row of rows) {
    if (typeof row.session_key !== 'number') continue

    const session = sessionByKey.get(row.session_key)
    const meeting = meetingById.get(row.race_id)
    if (!session || !meeting) continue

    const qualifyingName = session.session_name === 'Sprint'
      ? 'Sprint Qualifying'
      : 'Qualifying'
    const qualifyingSessions = qualifyingByMeetingKey.get(meeting.meeting_key) ?? []
    const qualifyingSession = qualifyingSessions.find((s) => s.session_name === qualifyingName)
      ?? qualifyingSessions[0] ?? null

    const prediction: Prediction = {
      id: row.id,
      user_id: row.user_id,
      race_id: row.race_id,
      session_key: row.session_key,
      position_1: row.position_1,
      position_2: row.position_2,
      position_3: row.position_3,
      position_4: row.position_4,
      position_5: row.position_5,
      position_6: row.position_6,
      position_7: row.position_7,
      position_8: row.position_8,
      position_9: row.position_9,
      position_10: row.position_10,
      points: row.points,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
    result.push({
      prediction,
      meetingName: meeting.meeting_name,
      meetingKey: meeting.meeting_key,
      sessionKey: session.session_key,
      sessionName: session.session_name,
      qualifyingSessionKey: qualifyingSession?.session_key ?? null,
      points: row.points ?? null,
      dateStart: session.date_start,
    })
  }

  return result
}
