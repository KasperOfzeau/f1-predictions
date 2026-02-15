import { NextRequest, NextResponse } from 'next/server'
import type { Driver } from '@/lib/types'

const F1_API_URL = 'https://api.openf1.org/v1'

/**
 * GET /api/race-result?session_key=7782
 * Returns top 10 finish order (driver numbers) and drivers for the session.
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
    const [resultRes, driversRes] = await Promise.all([
      fetch(`${F1_API_URL}/session_result?session_key=${key}&position<=10`),
      fetch(`${F1_API_URL}/drivers?session_key=${key}`),
    ])

    if (!resultRes.ok || !driversRes.ok) {
      return NextResponse.json(
        { error: 'Could not fetch race data' },
        { status: 502 }
      )
    }

    const [resultData, driversData] = await Promise.all([
      resultRes.json(),
      driversRes.json(),
    ])

    type Row = { position: number; driver_number: number }
    if (!Array.isArray(resultData) || resultData.length < 10) {
      return NextResponse.json(
        { error: 'Race result not available yet' },
        { status: 404 }
      )
    }

    const sorted = (resultData as Row[]).sort((a, b) => a.position - b.position)
    const resultOrder = sorted.slice(0, 10).map((row) => row.driver_number)
    const drivers = (driversData as Driver[]).sort(
      (a, b) => a.driver_number - b.driver_number
    )

    return NextResponse.json({ resultOrder, drivers })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch race result' },
      { status: 500 }
    )
  }
}
