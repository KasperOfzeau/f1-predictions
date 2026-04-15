import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushToUser } from '@/lib/services/pushNotifications'

const HOUR_MS = 60 * 60 * 1000
const NOTIFICATION_TYPE = 'race_reminder' as const

type NotificationKind = 'prediction_reminder' | 'race_start'

interface SessionRow {
  session_key: number
  session_name: string
  meeting_key: number
  location: string | null
  date_start: string
}

interface NotificationMetadata {
  kind: NotificationKind
  session_key: number
  session_name: string
  meeting_key: number
}

interface PreparedNotification {
  userId: string
  title: string
  body: string
  url: string
  metadata: NotificationMetadata
}

function getWindow(now: Date, fromHours: number, toHours: number) {
  return {
    from: new Date(now.getTime() + fromHours * HOUR_MS),
    to: new Date(now.getTime() + toHours * HOUR_MS),
  }
}

async function getSubscribedUserIds(supabase: ReturnType<typeof createAdminClient>) {
  const { data: subscribedUsers } = await supabase
    .from('push_subscriptions')
    .select('user_id')

  return [...new Set(subscribedUsers?.map((subscription) => subscription.user_id) ?? [])]
}

async function getSessionGrandPrixLabel(
  supabase: ReturnType<typeof createAdminClient>,
  session: SessionRow
) {
  const { data: meeting } = await supabase
    .from('meetings')
    .select('meeting_name, location')
    .eq('meeting_key', session.meeting_key)
    .single()

  return meeting?.meeting_name ?? meeting?.location ?? session.location ?? 'unknown Grand Prix'
}

async function getAlreadyNotifiedUserIds(
  supabase: ReturnType<typeof createAdminClient>,
  userIds: string[],
  session: SessionRow,
  kind: NotificationKind
) {
  if (!userIds.length) {
    return new Set<string>()
  }

  const { data: existingNotifications } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', NOTIFICATION_TYPE)
    .in('user_id', userIds)
    .contains('metadata', {
      kind,
      session_key: session.session_key,
    })

  return new Set(existingNotifications?.map((notification) => notification.user_id) ?? [])
}

async function sendPreparedNotifications(
  supabase: ReturnType<typeof createAdminClient>,
  notifications: PreparedNotification[]
) {
  if (!notifications.length) {
    return 0
  }

  const { error } = await supabase
    .from('notifications')
    .insert(
      notifications.map((notification) => ({
        user_id: notification.userId,
        type: NOTIFICATION_TYPE,
        title: notification.title,
        message: notification.body,
        link: notification.url,
        read: false,
        metadata: notification.metadata,
      }))
    )

  if (error) {
    console.error('Error saving notifications:', error)
  }

  await Promise.all(
    notifications.map((notification) =>
      sendPushToUser(notification.userId, {
        title: notification.title,
        body: notification.body,
        url: notification.url,
      })
    )
  )

  return notifications.length
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date()
  const predictionWindow = getWindow(now, 4, 5)
  const raceWindow = getWindow(now, 1, 2)

  const [
    subscribedUserIds,
    { data: predictionSessions },
    { data: raceSessions },
  ] = await Promise.all([
    getSubscribedUserIds(supabase),
    supabase
      .from('sessions')
      .select('session_key, session_name, meeting_key, location, date_start')
      .in('session_name', ['Race', 'Sprint'])
      .gte('date_start', predictionWindow.from.toISOString())
      .lte('date_start', predictionWindow.to.toISOString()),
    supabase
      .from('sessions')
      .select('session_key, session_name, meeting_key, location, date_start')
      .eq('session_name', 'Race')
      .gte('date_start', raceWindow.from.toISOString())
      .lte('date_start', raceWindow.to.toISOString()),
  ])

  if (!subscribedUserIds.length) {
    return NextResponse.json({ ok: true, sent: 0, reason: 'No subscribed users found.' })
  }

  let predictionRemindersSent = 0
  let raceStartNotificationsSent = 0

  for (const session of (predictionSessions ?? []) as SessionRow[]) {
    const grandPrixLabel = await getSessionGrandPrixLabel(supabase, session)

    const { data: existingPredictions } = await supabase
      .from('predictions')
      .select('user_id')
      .eq('session_key', session.session_key)
      .in('user_id', subscribedUserIds)

    const usersWithPrediction = new Set(existingPredictions?.map((prediction) => prediction.user_id) ?? [])
    const usersWithoutPrediction = subscribedUserIds.filter((userId) => !usersWithPrediction.has(userId))
    const alreadyRemindedUserIds = await getAlreadyNotifiedUserIds(
      supabase,
      usersWithoutPrediction,
      session,
      'prediction_reminder'
    )

    const notifications = usersWithoutPrediction
      .filter((userId) => !alreadyRemindedUserIds.has(userId))
      .map((userId) => ({
        userId,
        title: 'Prediction reminder',
        body: `Don't forget to submit your ${session.session_name} prediction for the ${grandPrixLabel}. It starts in about 4 hours.`,
        url: '/predictions/race',
        metadata: {
          kind: 'prediction_reminder' as const,
          session_key: session.session_key,
          session_name: session.session_name,
          meeting_key: session.meeting_key,
        },
      }))

    predictionRemindersSent += await sendPreparedNotifications(supabase, notifications)
  }

  for (const session of (raceSessions ?? []) as SessionRow[]) {
    const grandPrixLabel = await getSessionGrandPrixLabel(supabase, session)
    const alreadyNotifiedUserIds = await getAlreadyNotifiedUserIds(
      supabase,
      subscribedUserIds,
      session,
      'race_start'
    )

    const notifications = subscribedUserIds
      .filter((userId) => !alreadyNotifiedUserIds.has(userId))
      .map((userId) => ({
        userId,
        title: 'Race starts soon!',
        body: `The ${grandPrixLabel} starts in about 1 hour.`,
        url: '/',
        metadata: {
          kind: 'race_start' as const,
          session_key: session.session_key,
          session_name: session.session_name,
          meeting_key: session.meeting_key,
        },
      }))

    raceStartNotificationsSent += await sendPreparedNotifications(supabase, notifications)
  }

  return NextResponse.json({
    ok: true,
    sent: predictionRemindersSent + raceStartNotificationsSent,
    predictionRemindersSent,
    raceStartNotificationsSent,
    windows: {
      predictionReminder: {
        from: predictionWindow.from.toISOString(),
        to: predictionWindow.to.toISOString(),
      },
      raceStart: {
        from: raceWindow.from.toISOString(),
        to: raceWindow.to.toISOString(),
      },
    },
  })
}
