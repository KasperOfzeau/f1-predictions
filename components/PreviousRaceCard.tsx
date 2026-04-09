import Image from 'next/image'
import Link from 'next/link'
import type { NextEvent } from '@/lib/types'
import { getResultPageHref } from '@/lib/resultPage'

function getCircuitImageSrc(circuitShortName: string): string {
  const base = circuitShortName.replace(/\s+/g, '-')
  const hasExtension = /\.(jpe?g|png|webp)$/i.test(base)
  return `/images/circuits/${hasExtension ? base : `${base}.jpg`}`
}

interface PreviousRaceCardProps {
  lastEvent: NextEvent | null
  hasPrediction: boolean
  points: number | null
  /** When true, show prediction/points section; when false, only race name + date */
  isLoggedIn?: boolean
}

export default function PreviousRaceCard({
  lastEvent,
  hasPrediction,
  points,
  isLoggedIn = false,
}: PreviousRaceCardProps) {
  const sessionLabel = 'Previous event'
  const noPredictionLabel = lastEvent?.session.session_name === 'Sprint'
    ? 'No prediction made for this sprint'
    : 'No prediction made for this race'

  return (
    <div className="relative rounded-xl border border-white/10 p-6 overflow-hidden min-h-[450px] bg-white/5">
      {lastEvent && (
        <div className="absolute inset-0 opacity-25">
          <Image
            src={getCircuitImageSrc(lastEvent.meeting.circuit_short_name)}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </div>
      )}
      <h3 className="relative z-10 text-2xl font-semibold text-white mb-2">{sessionLabel}</h3>
      <div className="absolute top-1/2 z-10 left-0 right-0 -translate-y-1/2 text-center p-6">
        <h4 className="text-white/80 text-4xl font-bold">{lastEvent?.meeting.meeting_name ?? '—'}</h4>
        {lastEvent && (
          <p className="text-white/60 mt-2 text-lg">
            {lastEvent.session.session_name} ·{' '}
            {new Date(lastEvent.session.date_start).toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}

        {isLoggedIn && lastEvent && (
          <div className="mt-6 flex flex-col items-center gap-4">
            {hasPrediction ? (
              <>
                <p className="text-white/80 text-lg">
                  Points: <span className="font-bold text-white">{points !== null ? points : '—'}</span>
                </p>
                <Link
                  href={getResultPageHref(lastEvent.session.session_key)}
                  className="px-5 py-2 rounded-full font-medium transition-colors border-2 border-f1-red text-white hover:bg-f1-red/20 cursor-pointer"
                >
                  View result
                </Link>
              </>
            ) : (
              <p className="text-white/50 text-sm">{noPredictionLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
