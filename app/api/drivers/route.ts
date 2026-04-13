import { NextRequest, NextResponse } from 'next/server'
import type { Driver } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1'
export const revalidate = 60

/**
 * GET /api/drivers?session_key=7782
 * Returns drivers for the session (for showing prediction when result not yet available).
 */
export async function GET(request: NextRequest) {
  const sessionKey = request.nextUrl.searchParams.get('session_key')
  const meetingKey = request.nextUrl.searchParams.get('meeting_key')

  if (sessionKey && meetingKey) {
    return NextResponse.json(
      { error: 'Use either session_key or meeting_key, not both' },
      { status: 400 }
    )
  }

  if (!sessionKey && !meetingKey) {
    return NextResponse.json(
      { error: 'Missing session_key or meeting_key' },
      { status: 400 }
    )
  }

  try {
    let apiUrl: string

    if (sessionKey) {
      if (!/^\d+$/.test(sessionKey)) {
        return NextResponse.json(
          { error: 'Missing or invalid session_key' },
          { status: 400 }
        )
      }

      const key = parseInt(sessionKey, 10)
      apiUrl = `${F1_API_URL}/drivers?session_key=${key}`
    } else {
      if (!(meetingKey === 'latest' || /^\d+$/.test(meetingKey!))) {
        return NextResponse.json(
          { error: 'Missing or invalid meeting_key' },
          { status: 400 }
        )
      }

      apiUrl = `${F1_API_URL}/drivers?meeting_key=${meetingKey}`
    }

    const res = await fetch(apiUrl, {
      next: { revalidate },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not fetch drivers' },
        { status: 502 }
      )
    }

    const driversData = await res.json()
    const drivers = meetingKey
      ? Array.from(
          new Map(
            (driversData as Driver[]).map((driver) => [driver.driver_number, driver])
          ).values()
        ).sort((a, b) => a.driver_number - b.driver_number)
      : (driversData as Driver[]).sort((a, b) => a.driver_number - b.driver_number)

    return NextResponse.json({ drivers })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}
