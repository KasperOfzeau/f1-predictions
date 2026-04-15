import { NextRequest, NextResponse } from 'next/server'
import { sendPushToAll } from '@/lib/services/pushNotifications'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams

  const payload = {
    title: searchParams.get('title')?.trim() || 'Test notification',
    body: searchParams.get('body')?.trim() || 'Dit is een handmatige test push.',
    url: searchParams.get('url')?.trim() || '/',
  }

  await sendPushToAll(payload)

  return NextResponse.json({ ok: true, sent: true, payload })
}
