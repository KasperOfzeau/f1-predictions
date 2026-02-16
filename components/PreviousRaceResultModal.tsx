'use client'

import { useState, useEffect } from 'react'
import type { Driver, Prediction } from '@/lib/types'
import Modal from './Modal'

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Prediction result – ${meetingName}`}
      size="md"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      }
    >
      {loading && (
        <p className="text-center text-gray-500 py-6">Loading result…</p>
      )}
      {error && !loading && (
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
}
