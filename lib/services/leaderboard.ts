import { createClient } from '@/lib/supabase/server'

export interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  rank: number
}

/**
 * Get global leaderboard - top players across all pools
 * @param limit - Number of top players to return (default 5)
 */
export async function getGlobalLeaderboard(limit: number = 5): Promise<LeaderboardEntry[]> {
  const supabase = await createClient()

  // Fetch all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .not('username', 'is', null)
    .order('username', { ascending: true })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  // Map to leaderboard entries with hardcoded 0 points for now
  const leaderboard: LeaderboardEntry[] = (profiles || []).map((profile, index) => ({
    user_id: profile.id,
    username: profile.username || 'Unknown',
    avatar_url: profile.avatar_url,
    total_points: 0, // Hardcoded for now - will be calculated later
    rank: index + 1,
  }))

  return leaderboard
}
