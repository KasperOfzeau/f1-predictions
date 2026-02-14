'use client'

import { useState, useEffect } from 'react'
import type { Session, Meeting, Driver, Prediction } from '@/lib/types'
import { getDriversForSession, getUserPrediction, savePrediction } from '@/lib/services/predictions'
import DriverDropdown from './DriverDropdown'

interface PredictionModalProps {
  isOpen: boolean
  onClose: () => void
  session: Session
  meeting: Meeting
}

export default function PredictionModal({ isOpen, onClose, session, meeting }: PredictionModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<(number | null)[]>(Array(10).fill(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load drivers and existing prediction on mount
  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Determine which qualifying session to use for driver data
        const qualifyingSessionName = session.session_name === 'Sprint' ? 'Sprint Qualifying' : 'Qualifying'

        // Fetch qualifying session to get the session_key for drivers
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        const { data: qualifyingSession } = await supabase
          .from('sessions')
          .select('*')
          .eq('meeting_key', meeting.meeting_key)
          .eq('session_name', qualifyingSessionName)
          .single()

        if (!qualifyingSession) {
          setError('Qualifying session not found')
          setLoading(false)
          return
        }

        // Fetch drivers for the qualifying session
        const driversData = await getDriversForSession(qualifyingSession.session_key)
        setDrivers(driversData)

        // Fetch existing prediction
        const existingPrediction = await getUserPrediction(meeting.id)

        if (existingPrediction) {
          // Pre-fill with existing prediction
          setSelectedDrivers([
            existingPrediction.position_1,
            existingPrediction.position_2,
            existingPrediction.position_3,
            existingPrediction.position_4,
            existingPrediction.position_5,
            existingPrediction.position_6,
            existingPrediction.position_7,
            existingPrediction.position_8,
            existingPrediction.position_9,
            existingPrediction.position_10,
          ])
        }
      } catch (err) {
        setError('Failed to load drivers. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, session.session_key, meeting.id])

  // Handle driver selection for a position
  const handleSelectDriver = (position: number, driverId: number | null) => {
    const newSelection = [...selectedDrivers]
    newSelection[position] = driverId
    setSelectedDrivers(newSelection)
  }

  // Check if driver is already selected in another position
  const isDriverSelected = (driverId: number, currentPosition: number): boolean => {
    return selectedDrivers.some((selected, index) =>
      index !== currentPosition && selected === driverId
    )
  }

  // Check if form is valid (all positions filled, no duplicates)
  const isValid = (): boolean => {
    // All positions must be filled
    if (selectedDrivers.some(id => id === null)) return false

    // No duplicates
    const uniqueIds = new Set(selectedDrivers.filter(id => id !== null))
    return uniqueIds.size === 10
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!isValid()) return

    setSaving(true)
    setError(null)

    const driverIds = selectedDrivers.filter((id): id is number => id !== null)

    const result = await savePrediction(meeting.id, driverIds)

    setSaving(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 1500)
    } else {
      setError(result.error || 'Failed to save prediction')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedDrivers.some(d => d !== null) ? 'Edit Your Prediction' : 'Make Your Prediction'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {meeting.meeting_name} - {session.session_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✓ Prediction saved successfully!
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ED1131]"></div>
            </div>
          )}

          {/* Prediction Form */}
          {!loading && (
            <div className="space-y-3">
              {selectedDrivers.map((selectedDriverId, position) => (
                <div key={position} className="flex items-center gap-3">
                  {/* Position Number */}
                  <div className="w-12 text-center">
                    <span className="font-bold text-gray-700">P{position + 1}</span>
                  </div>

                  {/* Driver Dropdown with Images */}
                  <DriverDropdown
                    drivers={drivers}
                    selectedDriverId={selectedDriverId}
                    onSelect={(driverId) => handleSelectDriver(position, driverId)}
                    isDriverDisabled={(driverId) => isDriverSelected(driverId, position)}
                    position={position}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {!loading && (
            <div className="flex gap-3 mt-6 pt-6">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid() || saving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Submit Prediction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
