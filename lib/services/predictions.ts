import { createClient } from '@/lib/supabase/client'
import type { Driver, Prediction } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1'

export interface TeamFromDrivers {
  name: string
  colour: string
}

/**
 * Fetch all drivers for a specific session from OpenF1 API
 */
export async function getDriversForSession(sessionKey: number): Promise<Driver[]> {
  try {
    const response = await fetch(`${F1_API_URL}/drivers?session_key=${sessionKey}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response.statusText}`)
    }

    const drivers: Driver[] = await response.json()

    // Sort by driver number for consistent display
    return drivers.sort((a, b) => a.driver_number - b.driver_number)
  } catch (error) {
    console.error('Error fetching drivers:', error)
    throw error
  }
}

/**
 * Fetch drivers for a meeting from OpenF1 API (e.g. meeting_key=latest for current season).
 * Deduplicates by driver_number so you get one entry per driver.
 * Use this for season predictions and for race result predictions when you have a meeting key.
 */
export async function getDriversForMeeting(meetingKey: number | 'latest'): Promise<Driver[]> {
  try {
    const response = await fetch(`${F1_API_URL}/drivers?meeting_key=${meetingKey}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response.statusText}`)
    }

    const data: Driver[] = await response.json()

    // API returns one row per driver per session; deduplicate by driver_number
    const byNumber = new Map<number, Driver>()
    data.forEach((d) => {
      if (!byNumber.has(d.driver_number)) byNumber.set(d.driver_number, d)
    })

    return Array.from(byNumber.values()).sort((a, b) => a.driver_number - b.driver_number)
  } catch (error) {
    console.error('Error fetching drivers for meeting:', error)
    throw error
  }
}

/**
 * Build a unique list of teams from a driver list (each driver has team_name and team_colour).
 * Sorted by team name.
 */
export function getTeamsFromDrivers(drivers: Driver[]): TeamFromDrivers[] {
  const byName = new Map<string, string>()
  drivers.forEach((d) => {
    if (!byName.has(d.team_name)) byName.set(d.team_name, d.team_colour)
  })
  return Array.from(byName.entries())
    .map(([name, colour]) => ({ name, colour }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get existing prediction for current user and meeting
 */
export async function getUserPrediction(meetingId: string): Promise<Prediction | null> {
  try {
    const supabase = createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('No authenticated user')
      return null
    }

    // Fetch prediction
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('race_id', meetingId)
      .single()

    if (error) {
      // Not found is okay, means no prediction yet
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching prediction:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getUserPrediction:', error)
    return null
  }
}

/**
 * Save or update prediction (uses UPSERT)
 * @param meetingId - The meeting ID (race_id in database)
 * @param driverIds - Array of 10 driver IDs in predicted finishing order
 */
export async function savePrediction(
  meetingId: string,
  driverIds: number[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    // Validate input
    if (driverIds.length !== 10) {
      return { success: false, error: 'Must predict exactly 10 drivers' }
    }

    // Check for duplicates
    const uniqueDrivers = new Set(driverIds)
    if (uniqueDrivers.size !== 10) {
      return { success: false, error: 'Cannot select the same driver twice' }
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'You must be logged in to make predictions' }
    }

    // UPSERT prediction
    const { error } = await supabase
      .from('predictions')
      .upsert({
        user_id: user.id,
        race_id: meetingId,
        position_1: driverIds[0],
        position_2: driverIds[1],
        position_3: driverIds[2],
        position_4: driverIds[3],
        position_5: driverIds[4],
        position_6: driverIds[5],
        position_7: driverIds[6],
        position_8: driverIds[7],
        position_9: driverIds[8],
        position_10: driverIds[9],
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,race_id'
      })

    if (error) {
      console.error('Error saving prediction:', error)
      return { success: false, error: error.message }
    }

    console.log('✓ Prediction saved successfully')
    return { success: true }
  } catch (error) {
    console.error('Error in savePrediction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
