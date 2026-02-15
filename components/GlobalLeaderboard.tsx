import Image from 'next/image'
import type { LeaderboardEntry } from '@/lib/services/leaderboard'

interface GlobalLeaderboardProps {
  entries: LeaderboardEntry[]
}

export default function GlobalLeaderboard({ entries }: GlobalLeaderboardProps) {
  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return { emoji: '🥇', color: 'text-yellow-600' }
      case 2:
        return { emoji: '🥈', color: 'text-gray-400' }
      case 3:
        return { emoji: '🥉', color: 'text-orange-600' }
      default:
        return { emoji: `#${rank}`, color: 'text-gray-600' }
    }
  }

  const getDisplayLetter = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || '?'
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No players yet</p>
      ) : (
        entries.map((entry) => {
          const rankDisplay = getRankDisplay(entry.rank)

          return (
            <div
              key={entry.user_id}
              className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Rank */}
              <div className={`text-lg sm:text-2xl font-bold ${rankDisplay.color} min-w-[32px] sm:min-w-[48px] text-center shrink-0`}>
                {rankDisplay.emoji}
              </div>

              {/* Avatar */}
              <div className="relative w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 shrink-0">
                {entry.avatar_url ? (
                  <Image
                    src={entry.avatar_url}
                    alt={entry.username}
                    fill
                    className="object-cover"
                    unoptimized
                    sizes="48px"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-lg font-semibold text-gray-500">
                    {getDisplayLetter(entry.username)}
                  </span>
                )}
              </div>

              {/* Username */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                  @{entry.username}
                </p>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <p className="font-bold text-base sm:text-xl text-gray-900">{entry.total_points}</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
