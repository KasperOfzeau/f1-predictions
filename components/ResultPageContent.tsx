'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Prediction } from '@/lib/types'
import ResultDetailView, { type ResultDetailViewHandle } from './ResultDetailView'

interface ResultPageContentProps {
  backHref: string
  backLabel: string
  sessionLabel: string
  meetingName: string
  sessionDate: string
  circuitImage: string | null
  sessionKey: number
  meetingKey: number
  qualifyingSessionKey: number | null
  prediction: Prediction | null
  points: number | null
  sharerName: string | null
  sharerAvatarUrl: string | null
  allowShare: boolean
}

export default function ResultPageContent({
  backHref,
  backLabel,
  sessionLabel,
  meetingName,
  sessionDate,
  circuitImage,
  sessionKey,
  meetingKey,
  qualifyingSessionKey,
  prediction,
  points,
  sharerName,
  sharerAvatarUrl,
  allowShare,
}: ResultPageContentProps) {
  const detailViewRef = useRef<ResultDetailViewHandle>(null)
  const [canShare, setCanShare] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:rounded-3xl sm:p-8">
        {circuitImage && (
          <div className="pointer-events-none absolute inset-0 opacity-10">
            <Image
              src={circuitImage}
              alt=""
              fill
              className="object-contain object-center"
              sizes="100vw"
            />
          </div>
        )}

        <div className="relative z-10 flex flex-col gap-5 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white/70 sm:text-[11px] sm:tracking-[0.24em]">
              <span className="h-2 w-2 rounded-full bg-f1-red" />
              {sessionLabel}
            </div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:mt-4 sm:text-5xl md:text-6xl">
              {meetingName}
            </h1>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-white/45 sm:text-sm sm:tracking-[0.2em]">
              {sessionDate}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link
              href={backHref}
              className="inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/8 sm:px-5"
            >
              {backLabel}
            </Link>
            {allowShare && canShare && (
              <button
                type="button"
                onClick={() => detailViewRef.current?.share()}
                disabled={shareBusy}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-f1-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-f1-red/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="m8.59 13.51 6.83 3.98" />
                  <path d="m15.41 6.51-6.82 3.98" />
                </svg>
                <span>{shareBusy ? 'Sharing...' : 'Share result'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-4 sm:mt-6">
        <ResultDetailView
          ref={detailViewRef}
          sessionKey={sessionKey}
          meetingKey={meetingKey}
          qualifyingSessionKey={qualifyingSessionKey}
          meetingName={meetingName}
          sessionName={sessionLabel}
          prediction={prediction}
          points={points}
          sharerName={sharerName}
          sharerAvatarUrl={sharerAvatarUrl}
          allowShare={allowShare}
          showShareButton={false}
          onShareStateChange={({ canShare: nextCanShare, shareBusy: nextShareBusy }) => {
            setCanShare(nextCanShare)
            setShareBusy(nextShareBusy)
          }}
        />
      </section>
    </>
  )
}
