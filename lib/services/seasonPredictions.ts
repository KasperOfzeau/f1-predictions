import { createClient } from '@/lib/supabase/client'
import type { SeasonPrediction } from '@/lib/types'

export interface SeasonPredictionInput {
  constructorsFirst: string
  constructorsSecond: string
  constructorsThird: string
  fastestPitstopTeam: string
  driversFirst: number | null
  driversSecond: number | null
  driversThird: number | null
  mostDnfs: number | null
  fewestDnfs: number | null
  safetyCarCount: number | null
  mostOvertakes: number | null
  fewestOvertakes: number | null
}

/**
 * Get the current season year (e.g. 2025). Uses the start of the F1 season (typically March).
 */
export function getCurrentSeasonYear(): number {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  // Season is usually Feb/March - Dec. If we're in Jan, show previous year's season form.
  if (month === 1) return year - 1
  return year
}

/**
 * Get season prediction for the current user and season year.
 */
export async function getSeasonPrediction(
  seasonYear: number
): Promise<SeasonPrediction | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('season_predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('season_year', seasonYear)
      .maybeSingle()

    if (error) {
      console.error('Error fetching season prediction:', error)
      return null
    }
    return data
  } catch (err) {
    console.error('Error in getSeasonPrediction:', err)
    return null
  }
}

/**
 * Save or update season prediction for the current user and season year.
 */
export async function saveSeasonPrediction(
  seasonYear: number,
  input: SeasonPredictionInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'You must be logged in to save predictions' }
    }

    const row = {
      user_id: user.id,
      season_year: seasonYear,
      updated_at: new Date().toISOString(),
      constructors_1st: input.constructorsFirst || null,
      constructors_2nd: input.constructorsSecond || null,
      constructors_3rd: input.constructorsThird || null,
      fastest_pitstop_team: input.fastestPitstopTeam || null,
      drivers_1st: input.driversFirst,
      drivers_2nd: input.driversSecond,
      drivers_3rd: input.driversThird,
      most_dnfs_driver: input.mostDnfs,
      fewest_dnfs_driver: input.fewestDnfs,
      safety_car_count: input.safetyCarCount,
      most_overtakes_driver: input.mostOvertakes,
      fewest_overtakes_driver: input.fewestOvertakes,
    }

    const { error } = await supabase.from('season_predictions').upsert(row, {
      onConflict: 'user_id,season_year',
    })

    if (error) {
      console.error('Error saving season prediction:', error)
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    console.error('Error in saveSeasonPrediction:', err)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
