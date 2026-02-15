import { createClient } from '@/lib/supabase/server'
import type { Prediction } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

const F1_API_URL = 'https://api.openf1.org/v1'

/**
 * Fetch race result (driver numbers in finish order 1–10) from OpenF1.
 * Uses session_result endpoint: top 10 by position.
 * @see https://api.openf1.org/v1/session_result?session_key=...&position<=10
 */
async function getRaceResultBySessionKey(sessionKey: number): Promise<number[] | null> {
  try {
    const res = await fetch(
      `${F1_API_URL}/session_result?session_key=${sessionKey}&position<=10`
    )
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data) || data.length < 10) return null

    type Row = { position: number; driver_number: number }
    const sorted = (data as Row[]).sort((a, b) => a.position - b.position)
    return sorted.slice(0, 10).map((row) => row.driver_number)
  } catch {
    return null
  }
}

const POINTS_CORRECT_POSITION = 5
const POINTS_IN_TOP_10 = 1

/**
 * Score a prediction against race result:
 * - 5 points per correct position (right driver at right place)
 * - 1 point if driver is in top 10 but not at predicted position
 * - 0 points if driver is not in top 10
 */
function calculatePoints(prediction: Prediction, resultOrder: number[]): number {
  const predOrder = [
    prediction.position_1,
    prediction.position_2,
    prediction.position_3,
    prediction.position_4,
    prediction.position_5,
    prediction.position_6,
    prediction.position_7,
    prediction.position_8,
    prediction.position_9,
    prediction.position_10,
  ]
  const top10Set = new Set(resultOrder.slice(0, 10))
  let points = 0
  for (let i = 0; i < Math.min(10, resultOrder.length); i++) {
    const predictedDriver = predOrder[i]
    if (predictedDriver === resultOrder[i]) {
      points += POINTS_CORRECT_POSITION
    } else if (top10Set.has(predictedDriver)) {
      points += POINTS_IN_TOP_10
    }
  }
  return points
}

/**
 * Get points earned for a user's prediction for a given race session.
 * Uses stored points if already in DB; otherwise calculates, saves, and returns.
 * Returns null if no result available yet or no prediction.
 * Pass supabaseAdmin when updating another user's prediction (bypasses RLS).
 */
export async function getPointsForPrediction(
  prediction: Prediction | null,
  sessionKey: number,
  supabaseAdmin?: SupabaseClient
): Promise<number | null> {
  if (!prediction) return null

  if (prediction.points != null) {
    return prediction.points
  }

  const resultOrder = await getRaceResultBySessionKey(sessionKey)
  if (!resultOrder || resultOrder.length < 10) return null

  const points = calculatePoints(prediction, resultOrder)
  const supabase = supabaseAdmin ?? (await createClient())
  await supabase
    .from('predictions')
    .update({ points, updated_at: new Date().toISOString() })
    .eq('id', prediction.id)

  return points
}
