import { createAdminClient } from '@/lib/supabase/admin'
import { getOrComputeSeasonPointsForUsers } from '@/lib/services/seasonScores'

export interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  rank: number
}

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Get global leaderboard - top players by season score (current year).
 * Uses admin client so the leaderboard can be shown on the public home page (no RLS block).
 * @param limit - Number of top players to return (default 5)
 */
export async function getGlobalLeaderboard(limit: number = 5): Promise<LeaderboardEntry[]> {
  const supabase = createAdminClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .not('username', 'is', null)
    .limit(200)

  if (error || !profiles?.length) {
    if (error) console.error('Error fetching leaderboard:', error)
    return []
  }

  const userIds = profiles.map((p) => p.id)
  const seasonPointsByUser = await getOrComputeSeasonPointsForUsers(userIds, CURRENT_YEAR)

  const withPoints = profiles.map((profile) => ({
    user_id: profile.id,
    username: profile.username || 'Unknown',
    avatar_url: profile.avatar_url,
    total_points: seasonPointsByUser[profile.id] ?? 0,
  }))

  withPoints.sort((a, b) => b.total_points - a.total_points)

  const top = withPoints.slice(0, limit)

  return top.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}
