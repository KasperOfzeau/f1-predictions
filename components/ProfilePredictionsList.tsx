'use client'

import { useState } from 'react'
import type { PredictionWithMeta } from '@/lib/services/profilePredictions'
import type { SeasonPrediction } from '@/lib/types'
import PreviousRaceResultModal from './PreviousRaceResultModal'
import SeasonPredictionViewModal from './SeasonPredictionViewModal'

interface ProfilePredictionsListProps {
  items: PredictionWithMeta[]
  seasonPrediction: SeasonPrediction | null
  seasonYear: number
  /** When false, empty state says "They haven't made...". Default true (own profile). */
  isOwnProfile?: boolean
}

export default function ProfilePredictionsList({
  items,
  seasonPrediction,
  seasonYear,
  isOwnProfile = true,
}: ProfilePredictionsListProps) {
  const [selected, setSelected] = useState<PredictionWithMeta | null>(null)
  const [showSeasonModal, setShowSeasonModal] = useState(false)

  const hasSeason = seasonPrediction != null
  const hasRaces = items.length > 0
  const hasAny = hasSeason || hasRaces

  if (!hasAny) {
    return (
      <p className="text-zinc-600 text-sm">
        {isOwnProfile ? "You haven't made any predictions yet." : "They haven't made any predictions yet."}
      </p>
    )
  }

  return (
    <>
      <ul className="divide-y divide-zinc-200">
        {hasSeason && (
          <li>
            <button
              type="button"
              onClick={() => setShowSeasonModal(true)}
              className="w-full text-left py-3 -mx-1 px-1 flex items-center justify-between gap-4 transition-colors hover:bg-zinc-50 rounded cursor-pointer"
            >
              <div className="min-w-0">
                <p className="font-medium text-carbon-black">
                  {seasonYear} Season
                </p>
                <p className="text-sm text-zinc-500">Season prediction</p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {seasonPrediction.points != null && (
                  <span className="text-sm font-semibold text-carbon-black">
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
          return (
            <li key={item.prediction.id}>
              <button
                type="button"
                onClick={() => setSelected(item)}
                className="w-full text-left py-3 -mx-1 px-1 flex items-center justify-between gap-4 transition-colors hover:bg-zinc-50 rounded cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="font-medium text-carbon-black truncate">
                    {item.meetingName}
                  </p>
                  <p className="text-sm text-zinc-500">{dateLabel}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {item.points != null && (
                    <span className="text-sm font-semibold text-carbon-black">
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
          prediction={selected.prediction}
          points={selected.points}
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
