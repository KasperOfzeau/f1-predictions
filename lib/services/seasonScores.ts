import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLastEvent } from '@/lib/services/meetings'
import { getLastRaceOrSprintForMeeting } from '@/lib/services/sessions'
import { getPointsForPrediction } from '@/lib/services/scoring'
import type { Prediction } from '@/lib/types'

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Returns the end time of the last finished race/sprint (ISO string).
 * Used to decide if cached season scores are still valid.
 * Returns null on error (e.g. RLS when not logged in) so callers can still proceed.
 */
export async function getLastFinishedRaceEnd(): Promise<string | null> {
  try {
    const last = await getLastEvent()
    return last?.session?.date_end ?? null
  } catch {
    return null
  }
}

/**
 * Backfill missing prediction points for pool members: for each prediction with
 * points = null for a race that already has a result, calculate and save points.
 * Uses admin client so we can read/update any user's predictions (RLS bypass).
 * Returns the set of user_ids that had at least one prediction updated (so season total must be recalc'd).
 */
async function backfillMissingPredictionPoints(
  admin: ReturnType<typeof createAdminClient>,
  userIds: string[],
  year: number
): Promise<Set<string>> {
  const updatedUserIds = new Set<string>()
  if (userIds.length === 0) return updatedUserIds

  const now = new Date().toISOString()
  const { data: predictionsRaw, error } = await admin
    .from('predictions')
    .select('*, meetings!inner(meeting_key, year)')
    .in('user_id', userIds)
    .is('points', null)

  if (error || !predictionsRaw?.length) return updatedUserIds

  const forYear = predictionsRaw.filter(
    (p: { meetings: { year: number } | { year: number }[] }) => {
      const m = Array.isArray(p.meetings) ? p.meetings[0] : p.meetings
      return m?.year === year
    }
  )

  for (const row of forYear) {
    const meeting = Array.isArray(row.meetings) ? row.meetings[0] : row.meetings
    const meetingKey = meeting?.meeting_key
    if (meetingKey == null) continue

    const session = await getLastRaceOrSprintForMeeting(admin, meetingKey, now)
    if (!session) continue

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
    const newPoints = await getPointsForPrediction(prediction, session.session_key, admin)
    if (newPoints != null) updatedUserIds.add(row.user_id)
  }

  return updatedUserIds
}

/**
 * Compute total prediction points for a user in a given season (sum over races in that year).
 */
async function computeUserSeasonPoints(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  year: number
): Promise<number> {
  const { data: rows, error } = await supabase
    .from('predictions')
    .select('points, meetings!inner(year)')
    .eq('user_id', userId)

  if (error) {
    console.error('Error computing season points:', error)
    return 0
  }

  const forYear = (rows ?? []).filter((r: { points?: number | null; meetings?: { year: number } | { year: number }[] | null }) => {
    const m = Array.isArray(r.meetings) ? r.meetings[0] : r.meetings
    return m?.year === year
  })
  const total = forYear.reduce(
    (sum: number, r: { points?: number | null }) => sum + (r.points ?? 0),
    0
  )
  return total
}

/**
 * Get or compute season points for one user. Uses cache if it exists and was updated
 * after the end of the last finished race; otherwise recalculates and upserts.
 */
export async function getOrComputeUserSeasonPoints(
  userId: string,
  year: number = CURRENT_YEAR
): Promise<number> {
  const supabase = await createClient()
  const lastEnd = await getLastFinishedRaceEnd()

  const { data: row } = await supabase
    .from('user_season_scores')
    .select('points, updated_at')
    .eq('user_id', userId)
    .eq('season_year', year)
    .single()

  const useCache =
    row &&
    (lastEnd == null || new Date(row.updated_at) >= new Date(lastEnd))

  if (useCache) {
    return row!.points
  }

  const points = await computeUserSeasonPoints(supabase, userId, year)
  await supabase.from('user_season_scores').upsert(
    {
      user_id: userId,
      season_year: year,
      points,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,season_year' }
  )
  return points
}

/**
 * Get or compute season points for multiple users (e.g. pool members).
 * Returns a map of user_id -> points.
 */
export async function getOrComputeSeasonPointsForUsers(
  userIds: string[],
  year: number = CURRENT_YEAR
): Promise<Record<string, number>> {
  if (userIds.length === 0) return {}

  const admin = createAdminClient()

  // Backfill missing prediction points for races that already have a result (admin bypasses RLS)
  const backfilledUserIds = await backfillMissingPredictionPoints(admin, userIds, year)

  const lastEnd = await getLastFinishedRaceEnd()

  const { data: rows } = await admin
    .from('user_season_scores')
    .select('user_id, points, updated_at')
    .eq('season_year', year)
    .in('user_id', userIds)

  const result: Record<string, number> = {}
  const toRecalc: string[] = []

  for (const userId of userIds) {
    const row = rows?.find((r) => r.user_id === userId)
    const useCache =
      row &&
      (lastEnd == null || new Date(row.updated_at) >= new Date(lastEnd)) &&
      !backfilledUserIds.has(userId)
    if (useCache) {
      result[userId] = row.points
    } else {
      toRecalc.push(userId)
    }
  }

  for (const userId of toRecalc) {
    const points = await computeUserSeasonPoints(admin, userId, year)
    result[userId] = points
    await admin.from('user_season_scores').upsert(
      {
        user_id: userId,
        season_year: year,
        points,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,season_year' }
    )
  }

  return result
}
