import Image from 'next/image'
import type { LeaderboardEntry } from '@/lib/services/leaderboard'

interface GlobalLeaderboardProps {
  entries: LeaderboardEntry[]
}

export default function GlobalLeaderboard({ entries }: GlobalLeaderboardProps) {
  const getDisplayLetter = (username: string) => {
    return username?.charAt(0)?.toUpperCase() || '?'
  }

  return (
    <div className="flex flex-col h-full min-h-[220px] gap-2 sm:gap-3">
      {entries.length === 0 ? (
        <p className="text-white/50 text-center py-6">No players yet</p>
      ) : (
        entries.map((entry) => (
            <div
              key={entry.user_id}
              className="flex-1 flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg overflow-hidden border border-white/10 bg-white/5 min-h-0"
            >
              <div className="text-xs text-white/60 min-w-[20px] text-center shrink-0 tabular-nums">
                {entry.rank}
              </div>

              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 bg-white/10">
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
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white/60">
                    {getDisplayLetter(entry.username)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base truncate text-white">
                  @{entry.username}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-base sm:text-lg text-white">{entry.total_points}</p>
                <p className="text-xs text-white/50">points</p>
              </div>
            </div>
          ))
      )}
    </div>
  )
}
