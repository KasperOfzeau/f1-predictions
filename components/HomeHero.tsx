'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { NextEvent } from '@/lib/types'
import type { PredictionAvailability } from '@/lib/types'
import PredictionModal from './PredictionModal'

interface HomeHeroProps {
  nextEvent: NextEvent
  isLoggedIn: boolean
  predictionAvailability: PredictionAvailability
  hasPrediction: boolean
  daysToGo: number
}

export default function HomeHero({
  nextEvent,
  isLoggedIn,
  predictionAvailability,
  hasPrediction,
  daysToGo,
}: HomeHeroProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const { session, meeting } = nextEvent

  return (
    <div className="hero relative min-h-75 sm:min-h-112 md:min-h-128 w-full flex flex-col justify-start items-center pb-0 sm:pb-12 pt-8 sm:pt-12 md:pt-16">
      {meeting.circuit_image && (
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none overflow-hidden">
          <div className="relative w-full h-full min-h-96 sm:min-h-112 md:min-h-128 scale-110 sm:scale-125">
            <Image
              src={meeting.circuit_image}
              alt={`Circuit ${meeting.circuit_short_name}`}
              fill
              className="object-contain opacity-10 rotate-355"
              unoptimized
            />
          </div>
        </div>
      )}
      <div className="relative z-10 space-y-3 sm:space-y-4 text-center mt-8 sm:mt-12 md:mt-16 px-4">
        <h2 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl text-white">
          {meeting.meeting_name.split(' ').slice(0, -2).join(' ')}{' '}
          <b>{meeting.meeting_name.split(' ').slice(-2).join(' ')}</b>
        </h2>
        <p className="text-xl sm:text-2xl md:text-3xl text-white opacity-70">
          {daysToGo} days to go
        </p>
      </div>
      <div className="relative z-10 mt-8 sm:mt-10 md:mt-12 flex justify-center">
        {isLoggedIn ? (
          <>
            <button
              type="button"
              onClick={() => predictionAvailability.canPredict && setShowModal(true)}
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
            <PredictionModal
              isOpen={showModal}
              onClose={() => setShowModal(false)}
              onPredictionSaved={() => {
                setShowModal(false)
                router.refresh()
              }}
              session={session}
              meeting={meeting}
            />
          </>
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
