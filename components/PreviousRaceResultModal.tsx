'use client'

import { useState, useEffect, useRef } from 'react'
import { toPng } from 'html-to-image'
import type { Driver, Prediction } from '@/lib/types'
import { getDriversForMeeting } from '@/lib/services/predictions'
import Modal from './Modal'
import ResultShareCard, { SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT } from './ResultShareCard'

type ResultStatus = 'correct' | 'in_top10' | 'wrong'

interface PreviousRaceResultModalProps {
  isOpen: boolean
  onClose: () => void
  sessionKey: number | null
  meetingKey?: number | null
  /** Qualifying session key – used to fetch drivers for accurate data */
  qualifyingSessionKey?: number | null
  meetingName: string
  sessionName?: string | null
  prediction: Prediction | null
  points: number | null
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

function getStatusBorderColor(status: ResultStatus): string {
  switch (status) {
    case 'correct':
      return 'border-l-emerald-500'
    case 'in_top10':
      return 'border-l-amber-500'
    case 'wrong':
      return 'border-l-red-500'
  }
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

function driverByNumber(drivers: Driver[], driverNumber: number): Driver | undefined {
  return drivers.find((d) => d.driver_number === driverNumber)
}

async function fetchDriversBySessionKey(sessionKey: number): Promise<Driver[]> {
  const res = await fetch(`/api/drivers?session_key=${sessionKey}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.drivers ?? []
}

export default function PreviousRaceResultModal({
  isOpen,
  onClose,
  sessionKey,
  meetingKey,
  qualifyingSessionKey,
  meetingName,
  sessionName,
  prediction,
  points,
}: PreviousRaceResultModalProps) {
  const [resultOrder, setResultOrder] = useState<number[] | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [predictionOnly, setPredictionOnly] = useState(false)
  const [shareBusy, setShareBusy] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)

  // No session key: show prediction only – fetch drivers via qualifying session key (accurate) or meeting key
  useEffect(() => {
    if (!isOpen || !prediction) return
    if (sessionKey != null) return

    if (meetingKey == null && qualifyingSessionKey == null) {
      setLoading(false)
      setPredictionOnly(true)
      setError(null)
      setResultOrder(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setPredictionOnly(true)
    setResultOrder(null)

    const loadDrivers = async () => {
      if (qualifyingSessionKey != null) {
        const d = await fetchDriversBySessionKey(qualifyingSessionKey)
        if (!cancelled) {
          setDrivers(d)
          setLoading(false)
          return
        }
      }
      if (meetingKey != null && !cancelled) {
        const d = await getDriversForMeeting(meetingKey)
        if (!cancelled) setDrivers(d)
      }
      if (!cancelled) setLoading(false)
    }
    loadDrivers()
    return () => { cancelled = true }
  }, [isOpen, sessionKey, meetingKey, qualifyingSessionKey, prediction])

  // Has session key: try result, fallback to prediction-only whenever result fails
  useEffect(() => {
    if (!isOpen || sessionKey == null) return

    const fetchResult = async () => {
      setLoading(true)
      setError(null)
      setPredictionOnly(false)
      try {
        const res = await fetch(`/api/race-result?session_key=${sessionKey}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Could not load result')
          setResultOrder(null)
          if (prediction) {
            setPredictionOnly(true)
            const driversSessionKey = qualifyingSessionKey ?? sessionKey
            let d: Driver[] = []
            if (driversSessionKey != null) {
              d = await fetchDriversBySessionKey(driversSessionKey)
              setDrivers(d)
            }
            if (d.length === 0 && meetingKey != null) {
              d = await getDriversForMeeting(meetingKey)
              setDrivers(d)
            }
          }
          setLoading(false)
          return
        }
        const data = await res.json()
        setResultOrder(data.resultOrder)
        // Drivers voor namen/teams ophalen via qualifying session key (nauwkeuriger voor dat weekend)
        if (qualifyingSessionKey != null) {
          const d = await fetchDriversBySessionKey(qualifyingSessionKey)
          setDrivers(d.length > 0 ? d : (data.drivers || []))
        } else {
          setDrivers(data.drivers || [])
        }
      } catch {
        setError('Could not load result')
        setResultOrder(null)
        if (prediction) {
          setPredictionOnly(true)
          const driversSessionKey = qualifyingSessionKey ?? sessionKey
          if (driversSessionKey != null) {
            const d = await fetchDriversBySessionKey(driversSessionKey)
            setDrivers(d)
          }
          if (meetingKey != null) {
            const d = await getDriversForMeeting(meetingKey)
            setDrivers(d)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [isOpen, sessionKey, meetingKey, qualifyingSessionKey, prediction])

  const predOrder = prediction
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

  const canShare =
    !loading &&
    !error &&
    resultOrder != null &&
    resultOrder.length >= 10 &&
    prediction != null

  async function handleShareImage() {
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
      const fileName = `Mijn voorspelling - ${safeName}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `Mijn voorspelling – ${meetingName}`,
          files: [file],
        })
      }
    } catch {
      // Download already happened; share is best-effort
    } finally {
      setShareBusy(false)
    }
  }

  const modal = (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${meetingName}${sessionName ? ` (${sessionName})` : ''}`}
      size="md"
      footer={
        <div className="flex flex-col gap-2 w-full">
          {canShare && (
            <button
              type="button"
              onClick={handleShareImage}
              disabled={shareBusy}
              className="w-full px-4 py-2 rounded-md font-medium transition-colors bg-f1-red text-white hover:bg-f1-red-hover disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
              <span>{shareBusy ? 'Sharing…' : 'Share results'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      {loading && (
        <p className="text-center text-gray-500 py-6">
          {sessionKey != null ? 'Loading result…' : 'Loading prediction…'}
        </p>
      )}
      {!loading && predictionOnly && prediction && (
        <>
          {error && (
            <p className="text-center text-amber-600 py-2 text-sm font-medium">
              Result not yet available
            </p>
          )}
          <p className="text-center text-gray-500 text-sm pb-3">Your prediction</p>
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            <div className="min-w-[28px] text-center shrink-0">#</div>
            <div className="flex-1 min-w-0">Prediction</div>
          </div>
          <div className="space-y-1">
            {predOrder?.map((driverNumber, index) => {
              const position = index + 1
              const driverInfo = driverByNumber(drivers, driverNumber)
              return (
                <div
                  key={`${position}-${driverNumber}`}
                  className="flex items-center gap-2 px-2 py-1.5 border border-gray-200 rounded-md overflow-hidden"
                >
                  <div className="text-sm font-bold text-gray-500 min-w-[28px] text-center shrink-0">
                    {position}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {driverInfo ? (
                      <>
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: driverInfo.team_colour
                              ? `#${driverInfo.team_colour}`
                              : '#e2e8f0',
                          }}
                        />
                        <span className="font-medium text-sm text-gray-900">
                          {driverInfo.name_acronym}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">#{driverNumber}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
      {error && !loading && !predictionOnly && (
        <p className="text-center text-red-600 py-6">{error}</p>
      )}
      {!loading && !error && resultOrder && resultOrder.length >= 10 && (
        <>
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
            <div className="min-w-[28px] text-center shrink-0">#</div>
            <div className="flex-1 min-w-0">Result</div>
            {prediction && <div className="flex-1 min-w-0">Prediction</div>}
            {prediction && <div className="min-w-[36px] text-right shrink-0">Pts</div>}
          </div>

          <div className="space-y-1">
            {resultOrder.map((driverNumber, index) => {
              const position = index + 1
              const actualDriver = driverByNumber(drivers, driverNumber)
              const predictedDriver = predOrder?.[index] ?? null
              const status =
                prediction && predictedDriver != null
                  ? getStatus(predictedDriver, driverNumber, resultOrder)
                  : null
              const predictedDriverInfo =
                predictedDriver != null
                  ? driverByNumber(drivers, predictedDriver)
                  : null
              const rowPoints = status != null ? getPointsForStatus(status) : null

              return (
                <div
                  key={`${position}-${driverNumber}`}
                  className={`flex items-center gap-2 px-2 py-1.5 border border-gray-200 rounded-md overflow-hidden ${
                    prediction && status != null ? `border-l-4 ${getStatusBorderColor(status)}` : ''
                  }`}
                  title={
                    prediction && status != null
                      ? status === 'correct'
                        ? 'Correct'
                        : status === 'in_top10'
                          ? 'In top 10'
                          : 'Wrong'
                      : undefined
                  }
                >
                  <div className="text-sm font-bold text-gray-500 min-w-[28px] text-center shrink-0">
                    {position}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {actualDriver ? (
                      <>
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: actualDriver.team_colour
                              ? `#${actualDriver.team_colour}`
                              : '#94a3b8',
                          }}
                        />
                        <span className="font-medium text-sm text-gray-900 truncate">
                          {actualDriver.name_acronym}
                        </span>
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">#{driverNumber}</span>
                    )}
                  </div>
                  {prediction && (
                    <>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {predictedDriverInfo ? (
                          <>
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: predictedDriverInfo.team_colour
                                  ? `#${predictedDriverInfo.team_colour}`
                                  : '#e2e8f0',
                              }}
                            />
                            <span
                              className={
                                status === 'correct'
                                  ? 'font-semibold text-sm text-emerald-700'
                                  : status === 'in_top10'
                                    ? 'text-sm text-amber-700'
                                    : 'text-sm text-gray-500'
                              }
                            >
                              {predictedDriverInfo.name_acronym}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </div>
                      <div className="min-w-[36px] text-right shrink-0 text-sm font-medium text-gray-700">
                        {rowPoints != null ? `${rowPoints}pt` : '—'}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {prediction && (
            <div className="mt-2 pt-2 border-t-2 border-gray-200 flex justify-end items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Total</span>
              <span className="text-base font-bold text-gray-900">
                {points != null ? `${points} pts` : '—'}
              </span>
            </div>
          )}
        </>
      )}

    </Modal>
  )

  const shareCard = canShare ? (
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
        />
      </div>
    </div>
  ) : null

  return (
    <>
      {modal}
      {shareCard}
    </>
  )
}
