import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser, sendPushToAll } from '@/lib/services/pushNotifications'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000)
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000)

  const { data: upcomingSessions } = await supabase
    .from('sessions')
    .select('*')
    .in('session_name', ['Race', 'Sprint'])
    .gte('date_start', inOneHour.toISOString())
    .lte('date_start', inTwoHours.toISOString())

  if (!upcomingSessions?.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No upcoming sessions from' + inOneHour.toISOString() + ' to ' + inTwoHours.toISOString() })
  }

  let totalSent = 0

  for (const session of upcomingSessions) {
    const { data: meeting } = await supabase
      .from('meetings')
      .select('meeting_name, location')
      .eq('meeting_key', session.meeting_key)
      .single()

    const locationLabel = meeting?.location ?? session.location ?? 'unknown'
    const sessionLabel = session.session_name

    await sendPushToAll({
      title: `${sessionLabel} starts soon!`,
      body: `The ${sessionLabel} in ${locationLabel} starts in about 1 hour.`,
      url: '/',
    })
    totalSent++

    const { data: subscribedUsers } = await supabase
      .from('push_subscriptions')
      .select('user_id')

    if (!subscribedUsers?.length) continue

    const userIds = [...new Set(subscribedUsers.map((s) => s.user_id))]

    const { data: existingPredictions } = await supabase
      .from('predictions')
      .select('user_id')
      .eq('session_key', session.session_key)
      .in('user_id', userIds)

    const usersWithPrediction = new Set(existingPredictions?.map((p) => p.user_id) ?? [])
    const usersWithout = userIds.filter((uid) => !usersWithPrediction.has(uid))

    for (const userId of usersWithout) {
      await sendPushToUser(userId, {
        title: 'Prediction reminder',
        body: `Don't forget to submit your ${sessionLabel} prediction for ${locationLabel}!`,
        url: '/predictions/race',
      })
      totalSent++
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent })
}
