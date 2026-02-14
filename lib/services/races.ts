import { createClient } from '@/lib/supabase/server'
import type { Race } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1/meetings'

export async function getNextRace(): Promise<Race | null> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const now = new Date().toISOString()

  // Check if races for this year are already in the database
  const { data: existingRaces, error: fetchError } = await supabase
    .from('races')
    .select('*')
    .eq('year', currentYear)
    .limit(1)

  // If there are no races, fetch them from the API
  if (!existingRaces || existingRaces.length === 0) {
    console.log('No races found in database, fetching from API...')
    await syncRacesFromAPI(currentYear)
  }

  // Get the next upcoming race
  const { data: nextRace, error } = await supabase
    .from('races')
    .select('*')
    .eq('year', currentYear)
    .gte('date_start', now)
    .order('date_start', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching next race:', error)
    return null
  }

  return nextRace
}

export async function syncRacesFromAPI(year: number): Promise<void> {
  const supabase = await createClient()

  try {
    // Fetch races from OpenF1 API
    const response = await fetch(`${F1_API_URL}?year=${year}`)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const apiRaces = await response.json()

    // Filter only Grand Prix races (no testing)
    const grandPrixRaces = apiRaces.filter((race: any) =>
      race.meeting_name.includes('Grand Prix')
    )

    // Transform and insert into database
    const racesToInsert = grandPrixRaces.map((race: any) => ({
      meeting_key: race.meeting_key,
      meeting_name: race.meeting_name,
      meeting_official_name: race.meeting_official_name,
      location: race.location,
      country_key: race.country_key,
      country_code: race.country_code,
      country_name: race.country_name,
      country_flag: race.country_flag,
      circuit_key: race.circuit_key,
      circuit_short_name: race.circuit_short_name,
      circuit_type: race.circuit_type,
      circuit_image: race.circuit_image,
      gmt_offset: race.gmt_offset,
      date_start: race.date_start,
      date_end: race.date_end,
      year: race.year,
    }))

    // Upsert races (insert or update on conflict)
    const { error } = await supabase
      .from('races')
      .upsert(racesToInsert, {
        onConflict: 'meeting_key',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Error inserting races:', error)
      throw error
    }

    console.log(`Synced ${racesToInsert.length} races for ${year}`)
  } catch (error) {
    console.error('Error syncing races from API:', error)
    throw error
  }
}

export async function getAllRaces(year: number): Promise<Race[]> {
  const supabase = await createClient()

  // Check if races are in the database
  const { data: existingRaces } = await supabase
    .from('races')
    .select('*')
    .eq('year', year)
    .limit(1)

  // Sync if not present
  if (!existingRaces || existingRaces.length === 0) {
    await syncRacesFromAPI(year)
  }

  // Fetch all races
  const { data: races, error } = await supabase
    .from('races')
    .select('*')
    .eq('year', year)
    .order('date_start', { ascending: true })

  if (error) {
    console.error('Error fetching races:', error)
    return []
  }

  return races || []
}
