import { createClient } from '@/lib/supabase/server'
import type { Meeting, Session, NextEvent, PredictionAvailability } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1'

export async function getNextEvent(): Promise<NextEvent | null> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()
  const now = new Date().toISOString()

  // STEP 1: Check if there are meetings for this year in the database
  const { data: existingMeetings } = await supabase
    .from('meetings')
    .select('*')
    .eq('year', currentYear)
    .limit(1)

  // If not, fetch all meetings for this year
  if (!existingMeetings || existingMeetings.length === 0) {
    console.log('No meetings found for this year, syncing all meetings...')
    await syncAllMeetings(currentYear)
  }

  // STEP 2: Get the next upcoming meeting (that hasn't happened yet)
  const { data: nextMeeting } = await supabase
    .from('meetings')
    .select('*')
    .eq('year', currentYear)
    .gte('date_start', now)
    .order('date_start', { ascending: true })
    .limit(1)
    .single()

  if (!nextMeeting) {
    console.log('No upcoming meetings found')
    return null
  }

  // STEP 3: Check if this meeting already has race/sprint sessions
  const { data: existingSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', nextMeeting.meeting_key)
    .in('session_name', ['Race', 'Sprint'])
    .limit(1)

  // If not, fetch the race/sprint sessions for this meeting
  if (!existingSessions || existingSessions.length === 0) {
    console.log(`No sessions found for meeting ${nextMeeting.meeting_key}, syncing...`)
    await syncSessionsForMeeting(nextMeeting.meeting_key)
  }

  // STEP 4: Get the next upcoming race/sprint session
  const { data: nextSession, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', nextMeeting.meeting_key)
    .in('session_name', ['Race', 'Sprint'])
    .gte('date_start', now)
    .order('date_start', { ascending: true })
    .limit(1)
    .single()

  if (sessionError || !nextSession) {
    console.error('Error fetching next session:', sessionError)
    return null
  }

  return {
    session: nextSession,
    meeting: nextMeeting,
  }
}

/**
 * Sync all meetings for a year (without sessions)
 */
async function syncAllMeetings(year: number): Promise<void> {
  const supabase = await createClient()

  try {
    console.log(`Fetching all meetings for ${year}...`)
    const meetingsResponse = await fetch(`${F1_API_URL}/meetings?year=${year}`)
    
    if (!meetingsResponse.ok) {
      throw new Error(`Meetings API request failed: ${meetingsResponse.statusText}`)
    }

    const apiMeetings = await meetingsResponse.json()

    // Filter only Grand Prix meetings
    const grandPrixMeetings = apiMeetings.filter((meeting: any) => 
      meeting.meeting_name.includes('Grand Prix')
    )

    // Transform and insert meetings
    const meetingsToInsert = grandPrixMeetings.map((meeting: any) => ({
      meeting_key: meeting.meeting_key,
      meeting_name: meeting.meeting_name,
      meeting_official_name: meeting.meeting_official_name,
      location: meeting.location,
      country_key: meeting.country_key,
      country_code: meeting.country_code,
      country_name: meeting.country_name,
      country_flag: meeting.country_flag,
      circuit_key: meeting.circuit_key,
      circuit_short_name: meeting.circuit_short_name,
      circuit_type: meeting.circuit_type,
      circuit_image: meeting.circuit_image,
      gmt_offset: meeting.gmt_offset,
      date_start: meeting.date_start,
      date_end: meeting.date_end,
      year: meeting.year,
    }))

    const { error: meetingError } = await supabase
      .from('meetings')
      .upsert(meetingsToInsert, {
        onConflict: 'meeting_key',
        ignoreDuplicates: false,
      })

    if (meetingError) {
      console.error('Error inserting meetings:', meetingError)
      throw meetingError
    }

    console.log(`✓ Synced ${meetingsToInsert.length} meetings for ${year}`)
  } catch (error) {
    console.error('Error syncing meetings:', error)
    throw error
  }
}

/**
 * Sync only race/sprint sessions for a specific meeting
 */
async function syncSessionsForMeeting(meetingKey: number): Promise<void> {
  const supabase = await createClient()

  try {
    console.log(`Fetching sessions for meeting ${meetingKey}...`)
    const sessionsResponse = await fetch(
      `${F1_API_URL}/sessions?meeting_key=${meetingKey}`
    )

    if (!sessionsResponse.ok) {
      throw new Error(`Sessions API request failed: ${sessionsResponse.statusText}`)
    }

    const sessions = await sessionsResponse.json()

    // Filter Race, Sprint, Qualifying, and Sprint Qualifying sessions
    const relevantSessions = sessions.filter((session: any) =>
      session.session_name === 'Race' ||
      session.session_name === 'Sprint' ||
      session.session_name === 'Qualifying' ||
      session.session_name === 'Sprint Qualifying'
    )

    if (relevantSessions.length === 0) {
      console.log(`No race/sprint/qualifying sessions found for meeting ${meetingKey}`)
      return
    }

    // Transform and insert sessions
    const sessionsToInsert = relevantSessions.map((session: any) => ({
      session_key: session.session_key,
      session_type: session.session_type,
      session_name: session.session_name,
      date_start: session.date_start,
      date_end: session.date_end,
      meeting_key: session.meeting_key,
      circuit_key: session.circuit_key,
      circuit_short_name: session.circuit_short_name,
      country_key: session.country_key,
      country_code: session.country_code,
      country_name: session.country_name,
      location: session.location,
      gmt_offset: session.gmt_offset,
      year: session.year,
    }))

    const { error: sessionsError } = await supabase
      .from('sessions')
      .upsert(sessionsToInsert, {
        onConflict: 'session_key',
        ignoreDuplicates: false,
      })

    if (sessionsError) {
      console.error('Error inserting sessions:', sessionsError)
      throw sessionsError
    }

    console.log(`✓ Synced ${sessionsToInsert.length} sessions (race/sprint/qualifying) for meeting ${meetingKey}`)
  } catch (error) {
    console.error('Error syncing sessions:', error)
    throw error
  }
}

/**
 * Utility: Sync ALL meetings and sessions at once
 * (Use this only for setup/testing)
 */
export async function syncAllMeetingsAndSessions(year: number): Promise<void> {
  const supabase = await createClient()

  try {
    // 1. Sync all meetings
    await syncAllMeetings(year)

    // 2. Fetch all meetings from database
    const { data: meetings } = await supabase
      .from('meetings')
      .select('meeting_key')
      .eq('year', year)

    if (!meetings || meetings.length === 0) {
      console.log('No meetings to sync sessions for')
      return
    }

    // 3. Sync sessions for each meeting
    for (const meeting of meetings) {
      await syncSessionsForMeeting(meeting.meeting_key)
    }

    console.log(`✓ Complete sync finished for ${year}`)
  } catch (error) {
    console.error('Error syncing all:', error)
    throw error
  }
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

  return meetings || []
}

export async function getSessionsForMeeting(meetingKey: number): Promise<Session[]> {
  const supabase = await createClient()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('meeting_key', meetingKey)
    .in('session_name', ['Race', 'Sprint', 'Qualifying', 'Sprint Qualifying'])
    .order('date_start', { ascending: true })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  return sessions || []
}

/**
 * Get all qualifying sessions for a specific meeting
 */
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

  return sessions || []
}

/**
 * Check if user can make a prediction for a race/sprint session
 *
 * Predictions are only possible when:
 * 1. The race/sprint itself hasn't happened yet (is in the future)
 * 2. The qualifying has already happened (is in the past)
 * 3. The starting grid data is available from the API
 *
 * For Race: checks if Qualifying has happened and starting grid is available
 * For Sprint: checks if Sprint Qualifying has happened and starting grid is available
 *
 * Returns an object with canPredict (boolean) and optional reason (string)
 */
export async function canMakePrediction(session: Session, meetingKey: number): Promise<PredictionAvailability> {
  try {
    const supabase = await createClient()
    const now = new Date()

    // STEP 1: Check if the race/sprint itself has already happened
    const raceStart = new Date(session.date_start)
    if (raceStart <= now) {
      console.log(`Race/Sprint has already started or finished - predictions not possible`)
      return { canPredict: false, reason: 'Race has started' }
    }

    // STEP 2: Determine which qualifying session to look for
    const qualifyingSessionName = session.session_name === 'Sprint' ? 'Sprint Qualifying' : 'Qualifying'

    // Get the qualifying session for this meeting
    const { data: qualifyingSession } = await supabase
      .from('sessions')
      .select('*')
      .eq('meeting_key', meetingKey)
      .eq('session_name', qualifyingSessionName)
      .single()

    if (!qualifyingSession) {
      console.log(`No ${qualifyingSessionName} session found for meeting ${meetingKey}`)
      return { canPredict: false, reason: 'Qualifying session not found' }
    }

    // STEP 3: Check if qualifying has already happened
    const qualifyingEnd = new Date(qualifyingSession.date_end)
    if (qualifyingEnd > now) {
      console.log(`${qualifyingSessionName} hasn't happened yet - predictions not possible`)
      return { canPredict: false, reason: 'Qualifying not yet happened' }
    }

    // STEP 4: Check if starting grid data is available from API
    const response = await fetch(
      `${F1_API_URL}/starting_grid?session_key=${qualifyingSession.session_key}&position<=1`
    )

    if (!response.ok) {
      console.error('Failed to fetch starting grid data')
      return { canPredict: false, reason: 'Grid data not available' }
    }

    const startingGridData = await response.json()

    // If we have at least one position, the starting grid is available
    const isAvailable = Array.isArray(startingGridData) && startingGridData.length > 0

    if (isAvailable) {
      console.log(`✓ Starting grid available - predictions can be made`)
      return { canPredict: true }
    } else {
      console.log(`Starting grid data not yet available from API`)
      return { canPredict: false, reason: 'Grid data not available' }
    }
  } catch (error) {
    console.error('Error checking prediction availability:', error)
    return { canPredict: false, reason: 'Error checking availability' }
  }
}