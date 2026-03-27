'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { PredictionWithMeta } from '@/lib/services/userPredictions'
import type { SeasonPrediction } from '@/lib/types'

const PreviousRaceResultModal = dynamic(() => import('./PreviousRaceResultModal'), {
  ssr: false,
})

const SeasonPredictionViewModal = dynamic(() => import('./SeasonPredictionViewModal'), {
  ssr: false,
})

interface UserPredictionsListProps {
  items: PredictionWithMeta[]
  seasonPrediction: SeasonPrediction | null
  seasonYear: number
  /** When false, empty state says "They haven't made...". Default true (own profile). */
  isOwnProfile?: boolean
  sharerName?: string | null
  sharerAvatarUrl?: string | null
  theme?: 'light' | 'dark'
}

export default function UserPredictionsList({
  items,
  seasonPrediction,
  seasonYear,
  isOwnProfile = true,
  sharerName = null,
  sharerAvatarUrl = null,
  theme = 'light',
}: UserPredictionsListProps) {
  const [selected, setSelected] = useState<PredictionWithMeta | null>(null)
  const [showSeasonModal, setShowSeasonModal] = useState(false)

  const hasSeason = seasonPrediction != null
  const hasRaces = items.length > 0
  const hasAny = hasSeason || hasRaces

  if (!hasAny) {
    return (
      <p className={theme === 'dark' ? 'text-sm text-white/60' : 'text-zinc-600 text-sm'}>
        {isOwnProfile ? "You haven't made any predictions yet." : "They haven't made any predictions yet."}
      </p>
    )
  }

  const containerClassName = theme === 'dark'
    ? 'grid grid-cols-1 gap-3'
    : 'divide-y divide-zinc-200'
  const itemClassName = theme === 'dark'
    ? 'w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-f1-red hover:bg-white/7 cursor-pointer'
    : 'w-full text-left py-3 -mx-1 px-1 flex items-center justify-between gap-4 transition-colors hover:bg-zinc-50 rounded cursor-pointer'
  const titleClassName = theme === 'dark'
    ? 'font-medium text-white truncate'
    : 'font-medium text-carbon-black truncate'
  const metaClassName = theme === 'dark'
    ? 'text-sm text-white/50'
    : 'text-sm text-zinc-500'
  const pointsClassName = theme === 'dark'
    ? 'text-sm font-semibold text-white'
    : 'text-sm font-semibold text-carbon-black'

  return (
    <>
      <ul className={containerClassName}>
        {hasSeason && (
          <li>
            <button
              type="button"
              onClick={() => setShowSeasonModal(true)}
              className={itemClassName}
            >
              <div className="min-w-0">
                <p className={theme === 'dark' ? 'font-medium text-white' : 'font-medium text-carbon-black'}>
                  {seasonYear} Season
                </p>
                <p className={metaClassName}>Season prediction</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {seasonPrediction.points != null && (
                  <span className={pointsClassName}>
                    {seasonPrediction.points} pts
                  </span>
                )}
                <span className="text-sm text-f1-red font-medium">View</span>
              </div>
            </button>
          </li>
        )}
        {items.map((item) => {
          const dateLabel = new Date(item.dateStart).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          const sessionLabel = item.sessionName ?? 'Race'
          return (
            <li key={item.prediction.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className={itemClassName}
              >
                <div className="min-w-0">
                  <p className={titleClassName}>
                    {item.meetingName}
                  </p>
                  <p className={metaClassName}>
                    {sessionLabel} · {dateLabel}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {item.points != null && (
                    <span className={pointsClassName}>
                      {item.points} pts
                    </span>
                  )}
                  <span className="text-sm text-f1-red font-medium">View</span>
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {selected && (
        <PreviousRaceResultModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          sessionKey={selected.sessionKey}
          meetingKey={selected.meetingKey}
          qualifyingSessionKey={selected.qualifyingSessionKey}
          meetingName={selected.meetingName}
          sessionName={selected.sessionName}
          prediction={selected.prediction}
          points={selected.points}
          sharerName={sharerName}
          sharerAvatarUrl={sharerAvatarUrl}
          allowShare={isOwnProfile}
        />
      )}

      {seasonPrediction && (
        <SeasonPredictionViewModal
          isOpen={showSeasonModal}
          onClose={() => setShowSeasonModal(false)}
          seasonPrediction={seasonPrediction}
          seasonYear={seasonYear}
        />
      )}
    </>
  )
}
