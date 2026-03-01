import { NextRequest, NextResponse } from 'next/server'
import type { Driver } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1'

/**
 * GET /api/drivers?session_key=7782
 * Returns drivers for the session (for showing prediction when result not yet available).
 */
export async function GET(request: NextRequest) {
  const sessionKey = request.nextUrl.searchParams.get('session_key')
  if (!sessionKey || !/^\d+$/.test(sessionKey)) {
    return NextResponse.json(
      { error: 'Missing or invalid session_key' },
      { status: 400 }
    )
  }

  const key = parseInt(sessionKey, 10)

  try {
    const res = await fetch(`${F1_API_URL}/drivers?session_key=${key}`)
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not fetch drivers' },
        { status: 502 }
      )
    }
    const driversData = await res.json()
    const drivers = (driversData as Driver[]).sort(
      (a, b) => a.driver_number - b.driver_number
    )
    return NextResponse.json({ drivers })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch drivers' },
      { status: 500 }
    )
  }
}
