import { createClient } from '@/lib/supabase/server'
import type { Prediction } from '@/lib/types'
import {
  getLastRaceOrSprintForMeeting,
  getNextRaceOrSprintForMeeting,
  getQualifyingForMeeting,
} from '@/lib/services/sessions'
import { ensureSessionsSyncedForMeeting } from '@/lib/services/sessions'

export interface PredictionWithMeta {
  prediction: Prediction
  meetingName: string
  meetingKey: number
  sessionKey: number | null
  /** Qualifying session key – use this to fetch drivers for accurate data */
  qualifyingSessionKey: number | null
  points: number | null
  dateStart: string
}

/**
 * Fetch the last N predictions for a user with meeting info and session key for result/drivers.
 */
export async function getRecentPredictionsForUser(
  userId: string,
  limit = 5
): Promise<PredictionWithMeta[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: rows, error } = await supabase
    .from('predictions')
    .select(`
      *,
      meetings!inner (
        id,
        meeting_key,
        meeting_name,
        date_start,
        date_end
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error || !rows?.length) return []

  const result: PredictionWithMeta[] = []

  for (const row of rows) {
    const meeting = Array.isArray(row.meetings) ? row.meetings[0] : row.meetings
    if (!meeting) continue

    const meetingKey = meeting.meeting_key as number
    await ensureSessionsSyncedForMeeting(supabase, meetingKey)

    const isPast = meeting.date_end < now
    const session = isPast
      ? await getLastRaceOrSprintForMeeting(supabase, meetingKey, now)
      : await getNextRaceOrSprintForMeeting(supabase, meetingKey, now)

    const qualifyingSessions = await getQualifyingForMeeting(meetingKey)
    const qualifyingSession = qualifyingSessions.find((s) => s.session_name === 'Qualifying')
      ?? qualifyingSessions[0] ?? null

    const prediction: Prediction = {
      id: row.id,
      user_id: row.user_id,
      race_id: row.race_id,
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
      meetingName: meeting.meeting_name as string,
      meetingKey,
      sessionKey: session?.session_key ?? null,
      qualifyingSessionKey: qualifyingSession?.session_key ?? null,
      points: (row as Prediction).points ?? null,
      dateStart: meeting.date_start as string,
    })
  }

  return result
}
