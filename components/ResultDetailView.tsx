'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { Driver, Prediction } from '@/lib/types'
import { getDriversForMeeting } from '@/lib/services/predictions'
import ResultShareCard, { SHARE_CARD_HEIGHT, SHARE_CARD_WIDTH } from './ResultShareCard'

type ResultStatus = 'correct' | 'in_top10' | 'wrong'

interface ResultDetailViewProps {
  sessionKey: number | null
  meetingKey?: number | null
  qualifyingSessionKey?: number | null
  meetingName: string
  sessionName?: string | null
  prediction: Prediction | null
  points: number | null
  sharerName?: string | null
  sharerAvatarUrl?: string | null
  allowShare?: boolean
  showShareButton?: boolean
  onShareStateChange?: (state: { canShare: boolean; shareBusy: boolean }) => void
}

export interface ResultDetailViewHandle {
  share: () => void
}

function getStatus(
  predictedDriver: number,
  actualDriver: number,
  resultOrder: number[]
): ResultStatus {
  if (predictedDriver === actualDriver) return 'correct'
  if (resultOrder.includes(predictedDriver)) return 'in_top10'
  return 'wrong'
}

function getPointsForStatus(status: ResultStatus): number {
  switch (status) {
    case 'correct':
      return 5
    case 'in_top10':
      return 1
    case 'wrong':
      return 0
  }
}

function getStatusAccent(status: ResultStatus): string {
  switch (status) {
    case 'correct':
      return 'border-l-emerald-400'
    case 'in_top10':
      return 'border-l-amber-400'
    case 'wrong':
      return 'border-l-red-400'
  }
}

function getStatusText(status: ResultStatus): string {
  switch (status) {
    case 'correct':
      return 'text-emerald-300'
    case 'in_top10':
      return 'text-amber-300'
    case 'wrong':
      return 'text-red-300'
  }
}

function driverByNumber(drivers: Driver[], driverNumber: number): Driver | undefined {
  return drivers.find((driver) => driver.driver_number === driverNumber)
}

function renderDriverBadge(driver: Driver) {
  if (driver.headshot_url) {
    return (
      <span className="inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={driver.headshot_url}
          alt={driver.full_name}
          width={32}
          height={32}
          className="block h-full w-full object-cover object-top"
        />
      </span>
    )
  }

  return (
    <span
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full"
      style={{
        backgroundColor: driver.team_colour ? `#${driver.team_colour}` : '#94a3b8',
      }}
    />
  )
}

async function fetchDriversBySessionKey(sessionKey: number): Promise<Driver[]> {
  const res = await fetch(`/api/drivers?session_key=${sessionKey}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.drivers ?? []
}

const ResultDetailView = forwardRef<ResultDetailViewHandle, ResultDetailViewProps>(function ResultDetailView({
  sessionKey,
  meetingKey = null,
  qualifyingSessionKey = null,
  meetingName,
  sessionName,
  prediction,
  points,
  sharerName = null,
  sharerAvatarUrl = null,
  allowShare = false,
  showShareButton = true,
  onShareStateChange,
}, ref) {
  const [resultOrder, setResultOrder] = useState<number[] | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [predictionOnly, setPredictionOnly] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    const loadPredictionOnly = async (fallbackError: string | null = null) => {
      if (meetingKey == null && qualifyingSessionKey == null) {
        if (!cancelled) {
          setPredictionOnly(true)
          setResultOrder(null)
          setError(fallbackError)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(fallbackError)
      setPredictionOnly(true)
      setResultOrder(null)

      if (qualifyingSessionKey != null) {
        const qualifyingDrivers = await fetchDriversBySessionKey(qualifyingSessionKey)
        if (!cancelled && qualifyingDrivers.length > 0) {
          setDrivers(qualifyingDrivers)
          setLoading(false)
          return
        }
      }

      if (meetingKey != null) {
        const meetingDrivers = await getDriversForMeeting(meetingKey)
        if (!cancelled) {
          setDrivers(meetingDrivers)
        }
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    const loadResult = async () => {
      if (sessionKey == null) {
        await loadPredictionOnly()
        return
      }

      setLoading(true)
      setError(null)
      setPredictionOnly(false)

      try {
        const res = await fetch(`/api/race-result?session_key=${sessionKey}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          const fallbackError = data.error || 'Could not load result'
          setError(fallbackError)
          setResultOrder(null)

          if (prediction) {
            await loadPredictionOnly(fallbackError)
            return
          }

          if (!cancelled) {
            setLoading(false)
          }
          return
        }

        const data = await res.json()
        if (cancelled) return

        setResultOrder(data.resultOrder)

        if (qualifyingSessionKey != null) {
          const qualifyingDrivers = await fetchDriversBySessionKey(qualifyingSessionKey)
          if (!cancelled) {
            setDrivers(qualifyingDrivers.length > 0 ? qualifyingDrivers : (data.drivers || []))
          }
        } else {
          setDrivers(data.drivers || [])
        }
      } catch {
        const fallbackError = 'Could not load result'
        setError(fallbackError)
        setResultOrder(null)

        if (prediction) {
          await loadPredictionOnly(fallbackError)
          return
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadResult()

    return () => {
      cancelled = true
    }
  }, [sessionKey, meetingKey, qualifyingSessionKey, prediction])

  const predictionOrder = useMemo(
    () => (
      prediction
        ? [
            prediction.position_1,
            prediction.position_2,
            prediction.position_3,
            prediction.position_4,
            prediction.position_5,
            prediction.position_6,
            prediction.position_7,
            prediction.position_8,
            prediction.position_9,
            prediction.position_10,
          ]
        : null
    ),
    [prediction]
  )

  const canShare =
    allowShare &&
    !loading &&
    !error &&
    resultOrder != null &&
    resultOrder.length >= 10 &&
    prediction != null

  useEffect(() => {
    onShareStateChange?.({ canShare, shareBusy })
  }, [canShare, onShareStateChange, shareBusy])

  const scoreSummary = useMemo(() => {
    if (!prediction || !resultOrder || resultOrder.length < 10) return null

    return resultOrder.reduce(
      (summary, driverNumber, index) => {
        const predictedDriver = predictionOrder?.[index]
        if (predictedDriver == null) return summary

        const status = getStatus(predictedDriver, driverNumber, resultOrder)
        if (status === 'correct') summary.correct += 1
        if (status === 'in_top10') summary.inTop10 += 1
        return summary
      },
      { correct: 0, inTop10: 0 }
    )
  }, [prediction, predictionOrder, resultOrder])

  const handleShareImage = useCallback(async () => {
    if (!shareCardRef.current || !prediction || !resultOrder || resultOrder.length < 10) return

    setShareBusy(true)
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
      })
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const safeName = meetingName.replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim() || 'race'
      const fileName = `My prediction - ${safeName}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fileName
      anchor.click()
      URL.revokeObjectURL(url)

      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Mijn voorspelling – ${meetingName}`,
          files: [file],
        })
      }
    } catch {
      // Download already happened; native share is best-effort.
    } finally {
      setShareBusy(false)
    }
  }, [meetingName, prediction, resultOrder])

  useImperativeHandle(ref, () => ({
    share: () => {
      void handleShareImage()
    },
  }), [handleShareImage])

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.24em]">Detailed result</p>
          </div>
          {prediction && (
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 sm:text-xs sm:tracking-[0.2em]">Score</p>
                <p className="mt-1 text-lg font-semibold text-white sm:text-2xl">
                  {points != null ? `${points} pts` : 'Pending'}
                </p>
              </div>
              {scoreSummary && (
                <>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 sm:text-xs sm:tracking-[0.2em]">Correct</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300 sm:text-2xl">{scoreSummary.correct}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 sm:px-4 sm:py-3">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 sm:text-xs sm:tracking-[0.2em]">Top 10</p>
                    <p className="mt-1 text-lg font-semibold text-amber-300 sm:text-2xl">{scoreSummary.inTop10}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-5">
          {loading && (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-8 text-center text-sm text-white/60 sm:py-10">
              {sessionKey != null ? 'Loading result...' : 'Loading prediction...'}
            </div>
          )}

          {!loading && predictionOnly && prediction && (
            <div>
              {error && (
                <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Result not yet available. Showing the saved prediction instead.
                </div>
              )}
              <div className="mb-3 grid grid-cols-[32px_minmax(0,1fr)] gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-3 sm:px-3 sm:text-xs sm:tracking-[0.24em]">
                <div className="text-center">#</div>
                <div>Prediction</div>
              </div>
              <div className="space-y-2">
                {predictionOrder?.map((driverNumber, index) => {
                  const driver = driverByNumber(drivers, driverNumber)
                  return (
                    <div
                      key={`${index + 1}-${driverNumber}`}
                      className="grid grid-cols-[32px_minmax(0,1fr)] gap-2 rounded-xl border border-white/10 bg-black/20 px-2.5 py-2.5 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-3 sm:px-3 sm:py-3"
                    >
                      <div className="text-center text-xs font-bold text-white/45 sm:text-sm">{index + 1}</div>
                      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                        {driver ? (
                          <>
                            {renderDriverBadge(driver)}
                            <span className="truncate text-xs font-medium text-white sm:text-sm">
                              {driver.name_acronym}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-white/45 sm:text-sm">#{driverNumber}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {!loading && !predictionOnly && error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {!loading && !error && resultOrder && resultOrder.length >= 10 && (
            <div>
              <div
                className={`mb-3 grid gap-2 px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45 sm:gap-3 sm:px-3 sm:text-xs sm:tracking-[0.24em] ${
                  prediction
                    ? 'grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_38px] sm:grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_48px]'
                    : 'grid-cols-[32px_minmax(0,1fr)] sm:grid-cols-[40px_minmax(0,1fr)]'
                }`}
              >
                <div className="text-center">#</div>
                <div>Result</div>
                {prediction && <div>Prediction</div>}
                {prediction && <div className="text-center">Pts</div>}
              </div>
              <div className="space-y-2">
                {resultOrder.map((driverNumber, index) => {
                  const actualDriver = driverByNumber(drivers, driverNumber)
                  const predictedDriver = predictionOrder?.[index] ?? null
                  const predictedDriverInfo =
                    predictedDriver != null ? driverByNumber(drivers, predictedDriver) : null
                  const status =
                    prediction && predictedDriver != null
                      ? getStatus(predictedDriver, driverNumber, resultOrder)
                      : null
                  const rowPoints = status != null ? getPointsForStatus(status) : null

                  return (
                    <div
                      key={`${index + 1}-${driverNumber}`}
                      className={`grid gap-2 rounded-xl border border-white/10 bg-black/20 px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3 ${
                        prediction
                          ? 'grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_38px] sm:grid-cols-[40px_minmax(0,1fr)_minmax(0,1fr)_48px]'
                          : 'grid-cols-[32px_minmax(0,1fr)] sm:grid-cols-[40px_minmax(0,1fr)]'
                      } ${status ? `border-l-4 ${getStatusAccent(status)}` : ''}`}
                    >
                      <div className="flex items-center justify-center text-xs font-bold text-white/45 sm:text-sm">{index + 1}</div>
                      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                        {actualDriver ? (
                          <>
                            {renderDriverBadge(actualDriver)}
                            <span className="truncate text-xs font-medium text-white sm:text-sm">
                              {actualDriver.name_acronym}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-white/45 sm:text-sm">#{driverNumber}</span>
                        )}
                      </div>
                      {prediction && (
                        <>
                          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                            {predictedDriverInfo ? (
                              <>
                                {renderDriverBadge(predictedDriverInfo)}
                                <span className={`truncate text-xs font-medium sm:text-sm ${getStatusText(status!)}`}>
                                  {predictedDriverInfo.name_acronym}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-white/35 sm:text-sm">-</span>
                            )}
                          </div>
                          <div className="flex items-center justify-center text-xs font-medium text-white/70 sm:text-sm">
                            {rowPoints != null ? `${rowPoints}` : '-'}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {showShareButton && canShare && (
          <div className="mt-5 border-t border-white/10 pt-4 sm:pt-5">
            <button
              type="button"
              onClick={handleShareImage}
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
          </div>
        )}
      </section>

      {canShare && resultOrder && prediction && (
        <div
          aria-hidden
          style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}
        >
          <div ref={shareCardRef}>
            <ResultShareCard
              meetingName={meetingName}
              sessionName={sessionName}
              resultOrder={resultOrder}
              prediction={prediction}
              drivers={drivers}
              points={points}
              sharerName={sharerName}
              sharerAvatarUrl={sharerAvatarUrl}
            />
          </div>
        </div>
      )}
    </>
  )
})

export default ResultDetailView
