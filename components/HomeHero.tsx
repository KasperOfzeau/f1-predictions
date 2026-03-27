'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { NextEvent, PredictionAvailability } from '@/lib/types'

interface HomeHeroProps {
  nextEvent: NextEvent
  isLoggedIn: boolean
  predictionAvailability: PredictionAvailability
  hasPrediction: boolean
}

type CountdownSegment = {
  value: string
  label: string
}

type CountdownState = {
  status: string
  segments: CountdownSegment[]
}

function getCountdownState(dateStart: string, dateEnd: string, sessionName: string, now: number): CountdownState {
  const startMs = new Date(dateStart).getTime()
  const endMs = new Date(dateEnd).getTime()
  const diffMs = startMs - now

  if (now >= startMs && now < endMs) {
    return {
      status: `${sessionName} live now`,
      segments: [
        { value: '00', label: 'Hours' },
        { value: '00', label: 'Minutes' },
      ],
    }
  }

  if (now >= endMs) {
    return {
      status: 'Waiting for next event',
      segments: [
        { value: '00', label: 'Hours' },
        { value: '00', label: 'Minutes' },
      ],
    }
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (totalMinutes < 24 * 60) {
    return {
      status: 'Until lights out',
      segments: [
        { value: String(hours).padStart(2, '0'), label: 'Hours' },
        { value: String(minutes).padStart(2, '0'), label: 'Minutes' },
      ],
    }
  }

  return {
    status: `${days} day${days === 1 ? '' : 's'} to go`,
    segments: [
      { value: String(days), label: 'Days' },
      { value: String(hours).padStart(2, '0'), label: 'Hours' },
    ],
  }
}

export default function HomeHero({
  nextEvent,
  isLoggedIn,
  predictionAvailability,
  hasPrediction,
}: HomeHeroProps) {
  const router = useRouter()
  const [now, setNow] = useState(() => Date.now())
  const { session, meeting } = nextEvent
  const countdown = useMemo(
    () => getCountdownState(session.date_start, session.date_end, session.session_name, now),
    [now, session.date_end, session.date_start, session.session_name]
  )

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className="hero relative min-h-75 sm:min-h-112 md:min-h-128 w-full flex flex-col justify-start items-center pb-0 sm:pb-12 pt-8 sm:pt-12 md:pt-16">
      {meeting.circuit_image && (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
          <div className="relative w-full h-full max-h-full">
            <Image
              src={meeting.circuit_image}
              alt={`Circuit ${meeting.circuit_short_name}`}
              fill
              className="object-contain object-center opacity-10 rotate-355"
            />
          </div>
        </div>
      )}
      <div className="relative z-10 space-y-2.5 sm:space-y-3 text-center mt-8 sm:mt-12 md:mt-16 px-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] sm:text-xs uppercase tracking-[0.24em] text-white/70 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-f1-red" />
          {session.session_name === 'Sprint' ? 'Sprint' : 'Race'}
        </div>
        <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white">
          {meeting.meeting_name.split(' ').slice(0, -2).join(' ')}{' '}
          <b>{meeting.meeting_name.split(' ').slice(-2).join(' ')}</b>
        </h2>
        <div className="mx-auto flex w-fit flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-black/30 px-2.5 py-2.5 sm:gap-2 sm:px-4 sm:py-3.5 backdrop-blur-md">
          <div className="flex items-stretch justify-center gap-2 sm:gap-2.5">
            {countdown.segments.map((segment) => (
              <div
                key={segment.label}
                className="min-w-18 rounded-xl border border-white/10 bg-white/6 px-2.5 py-2 sm:min-w-24 sm:px-4 sm:py-3"
              >
                <div className="text-[1.65rem] sm:text-4xl font-semibold leading-none text-white tabular-nums">
                  {segment.value}
                </div>
                <div className="mt-1 text-[10px] sm:text-[11px] uppercase tracking-[0.24em] text-white/55">
                  {segment.label}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-white/75">
            {countdown.status}
          </p>
        </div>
      </div>
      <div className="relative z-10 mt-6 sm:mt-8 md:mt-10 flex justify-center">
        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => predictionAvailability.canPredict && router.push('/predictions/race')}
            disabled={!predictionAvailability.canPredict}
            className={`px-5 py-2 sm:px-6 rounded-full font-medium transition-colors border-2 sm:border-4 text-center text-sm sm:text-base ${
              predictionAvailability.canPredict
                ? 'border-f1-red text-white cursor-pointer hover:bg-f1-red/20'
                : 'border-white/30 text-white/60 cursor-not-allowed opacity-70'
            }`}
          >
            {predictionAvailability.canPredict
              ? (hasPrediction ? 'Edit prediction' : 'Enter your prediction')
              : predictionAvailability.reason || 'Predictions not available'}
          </button>
        ) : (
          <Link
            href="/login"
            className="px-5 py-2 sm:px-6 rounded-full font-medium transition-colors border-2 sm:border-4 border-f1-red text-white cursor-pointer text-center text-sm sm:text-base hover:bg-f1-red/20"
          >
            Login to make a prediction
          </Link>
        )}
      </div>
    </div>
  )
}
