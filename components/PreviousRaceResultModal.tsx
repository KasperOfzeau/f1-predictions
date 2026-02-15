'use client'

import { useState, useEffect } from 'react'
import type { Driver, Prediction } from '@/lib/types'

type ResultStatus = 'correct' | 'in_top10' | 'wrong'

interface PreviousRaceResultModalProps {
  isOpen: boolean
  onClose: () => void
  sessionKey: number
  meetingName: string
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

export default function PreviousRaceResultModal({
  isOpen,
  onClose,
  sessionKey,
  meetingName,
  prediction,
  points,
}: PreviousRaceResultModalProps) {
  const [resultOrder, setResultOrder] = useState<number[] | null>(null)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !sessionKey) return

    const fetchResult = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/race-result?session_key=${sessionKey}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error || 'Could not load result')
          setResultOrder(null)
          return
        }
        const data = await res.json()
        setResultOrder(data.resultOrder)
        setDrivers(data.drivers || [])
      } catch {
        setError('Could not load result')
        setResultOrder(null)
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [isOpen, sessionKey])

  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h3 className="text-lg font-bold text-gray-900">Prediction result – {meetingName}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-4 py-3">
          {loading && (
            <p className="text-center text-gray-500 py-6">Loading result…</p>
          )}
          {error && !loading && (
            <p className="text-center text-red-600 py-6">{error}</p>
          )}
          {!loading && !error && resultOrder && resultOrder.length >= 10 && (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
                <div className="min-w-[28px] text-center shrink-0">#</div>
                <div className="flex-1 min-w-0">Result</div>
                {prediction && <div className="flex-1 min-w-0">Prediction</div>}
                {prediction && <div className="min-w-[36px] text-right shrink-0">Pts</div>}
              </div>

              {/* Rows with per-position points */}
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

              {/* Total row */}
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
        </div>

        <div className="border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-sm text-gray-500">
          <button
            type="button"
            onClick={onClose}
             className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
