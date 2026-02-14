import { createClient } from '@/lib/supabase/server'
import type { Meeting, Session, NextEvent } from '@/lib/types'

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

    // Filter only Race and Sprint sessions
    const raceSessions = sessions.filter((session: any) =>
      session.session_name === 'Race' || session.session_name === 'Sprint'
    )

    if (raceSessions.length === 0) {
      console.log(`No race/sprint sessions found for meeting ${meetingKey}`)
      return
    }

    // Transform and insert sessions
    const sessionsToInsert = raceSessions.map((session: any) => ({
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

    console.log(`✓ Synced ${sessionsToInsert.length} race/sprint sessions for meeting ${meetingKey}`)
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
    .in('session_name', ['Race', 'Sprint'])
    .order('date_start', { ascending: true })

  if (error) {
    console.error('Error fetching sessions:', error)
    return []
  }

  return sessions || []
}