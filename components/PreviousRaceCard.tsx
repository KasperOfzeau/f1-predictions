'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { NextEvent, Prediction } from '@/lib/types'
import PreviousRaceResultModal from './PreviousRaceResultModal'

interface PreviousRaceCardProps {
  lastEvent: NextEvent
  hasPrediction: boolean
  points: number | null
  prediction: Prediction | null
}

export default function PreviousRaceCard({ lastEvent, hasPrediction, points, prediction }: PreviousRaceCardProps) {
  const [showResultModal, setShowResultModal] = useState(false)
  const { session, meeting } = lastEvent
  const sessionDate = new Date(session.date_start)
  const isSprint = session.session_name === 'Sprint'

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-gray-700 to-gray-800">
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
              {isSprint ? 'Last sprint race' : 'Last race'}
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
        </div>

        <div className="text-sm">
          <span className="font-medium text-gray-900">
            {sessionDate.toLocaleDateString('en-UK', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' - '}
            {sessionDate.toLocaleTimeString('en-UK', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Europe/Amsterdam',
            })}
          </span>
        </div>

        <div className="space-y-2 pt-2">
          {hasPrediction && (
            <><p className="text-sm text-gray-600">
              Points earned:{' '}
              <span className="font-bold text-gray-900">
                {points !== null ? points : '—'}
              </span>
            </p><button
              type="button"
              onClick={() => setShowResultModal(true)}
              className="w-full mt-4 px-4 py-2 rounded-md font-medium bg-f1-red hover:bg-f1-red-hover text-white cursor-pointer transition-colors"
            >
                View prediction result
              </button></>
          )}
          {!hasPrediction && (
            <button 
              type="button"
              disabled={true}
              className="w-full mt-4 px-4 py-2 rounded-md font-medium bg-gray-300 text-gray-600 cursor-not-allowed opacity-60 transition-colors"
            >
              No prediction made
            </button>
          )}
        </div>
      </div>

      <PreviousRaceResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        sessionKey={session.session_key}
        meetingName={meeting.meeting_name}
        prediction={prediction}
        points={points}
      />
    </div>
  )
}
