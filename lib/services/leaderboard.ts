import { createAdminClient } from '@/lib/supabase/admin'
import { getOrComputeSeasonPointsForUsers } from '@/lib/services/seasonScores'

export interface LeaderboardEntry {
  user_id: string
  username: string
  avatar_url: string | null
  total_points: number
  rank: number
}

export interface PaginatedLeaderboardResult {
  entries: LeaderboardEntry[]
  page: number
  pageSize: number
  totalEntries: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

function normalizePositiveInteger(value: number, fallback: number) {
  if (!Number.isFinite(value) || value < 1) return fallback

  return Math.floor(value)
}

async function getRankedLeaderboardEntries(): Promise<Omit<LeaderboardEntry, 'rank'>[]> {
  const supabase = createAdminClient()

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .not('username', 'is', null)

  if (error || !profiles?.length) {
    if (error) console.error('Error fetching leaderboard:', error)
    return []
  }

  const userIds = profiles.map((profile) => profile.id)
  const seasonPointsByUser = await getOrComputeSeasonPointsForUsers(userIds, CURRENT_YEAR)

  const withPoints = profiles.map((profile) => ({
    user_id: profile.id,
    username: profile.username || 'Unknown',
    avatar_url: profile.avatar_url,
    total_points: seasonPointsByUser[profile.id] ?? 0,
  }))

  withPoints.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points
    }

    return a.username.localeCompare(b.username)
  })

  return withPoints
}

/**
 * Get global leaderboard - top players by season score (current year).
 * Uses admin client so the leaderboard can be shown on the public home page (no RLS block).
 * @param limit - Number of top players to return (default 5)
 */
export async function getGlobalLeaderboard(limit: number = 5): Promise<LeaderboardEntry[]> {
  const pageSize = normalizePositiveInteger(limit, 5)
  const { entries } = await getPaginatedGlobalLeaderboard({ page: 1, pageSize })
  return entries
}

export async function getPaginatedGlobalLeaderboard({
  page = 1,
  pageSize = 25,
}: {
  page?: number
  pageSize?: number
} = {}): Promise<PaginatedLeaderboardResult> {
  const normalizedPageSize = normalizePositiveInteger(pageSize, 25)
  const normalizedRequestedPage = normalizePositiveInteger(page, 1)
  const rankedEntries = await getRankedLeaderboardEntries()
  const totalEntries = rankedEntries.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / normalizedPageSize))
  const currentPage = Math.min(normalizedRequestedPage, totalPages)
  const startIndex = (currentPage - 1) * normalizedPageSize

  const entries = rankedEntries
    .slice(startIndex, startIndex + normalizedPageSize)
    .map((entry, index) => ({
      ...entry,
      rank: startIndex + index + 1,
    }))

  return {
    entries,
    page: currentPage,
    pageSize: normalizedPageSize,
    totalEntries,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  }
}
