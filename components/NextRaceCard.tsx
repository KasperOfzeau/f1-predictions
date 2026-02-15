'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { NextEvent, PredictionAvailability } from '@/lib/types'
import PredictionModal from './PredictionModal'

interface NextRaceCardProps {
  nextEvent: NextEvent
  predictionAvailability: PredictionAvailability
  hasPrediction: boolean
}

export default function NextRaceCard({ nextEvent, predictionAvailability, hasPrediction }: NextRaceCardProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const { session, meeting } = nextEvent
  const sessionDate = new Date(session.date_start)
  const now = new Date()
  const daysUntil = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Determine if it's a sprint weekend
  const isSprint = session.session_name === 'Sprint'

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-[#ED1131] to-[#C00E28]">
        {meeting.circuit_image && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={meeting.circuit_image}
              alt={meeting.circuit_short_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-sm font-medium uppercase tracking-wide">
              {isSprint ? 'Next sprint race' : 'Next race'}
            </p>
            <h3 className="text-2xl font-bold mt-1">{meeting.meeting_name}</h3>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {meeting.country_flag && (
              <div className="relative w-12 h-8 rounded overflow-hidden border border-gray-200">
                <Image
                  src={meeting.country_flag}
                  alt={meeting.country_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{meeting.location}</p>
              <p className="text-sm text-gray-600">{meeting.circuit_short_name}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-[#ED1131]">{daysUntil}</p>
            <p className="text-xs text-gray-600">days to go</p>
          </div>
        </div>

        <div className="text-sm">
          <span className="font-medium text-gray-900">
            {sessionDate.toLocaleDateString('en-UK', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}{' - '}
            {sessionDate.toLocaleTimeString('en-UK', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Europe/Amsterdam',
            })}
          </span>
        </div>

        <button
          onClick={() => predictionAvailability.canPredict && setShowModal(true)}
          disabled={!predictionAvailability.canPredict}
          className={`w-full mt-4 px-4 py-2 rounded-md font-medium transition-colors ${
            predictionAvailability.canPredict
              ? 'bg-[#ED1131] hover:bg-[#C00E28] text-white cursor-pointer'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-60'
          }`}
        >
          {predictionAvailability.canPredict
            ? (hasPrediction ? 'Edit prediction' : 'Make prediction')
            : predictionAvailability.reason || 'Predictions not available'}
        </button>
      </div>

      {/* Prediction Modal */}
      <PredictionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onPredictionSaved={() => router.refresh()}
        session={session}
        meeting={meeting}
      />
    </div>
  )
}
