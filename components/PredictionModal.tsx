'use client'

import { useState, useEffect } from 'react'
import type { Session, Meeting, Driver } from '@/lib/types'
import { getDriversForMeeting, getUserPrediction, savePrediction } from '@/lib/services/predictions'
import DriverDropdown from './DriverDropdown'
import Modal from './Modal'

interface PredictionModalProps {
  isOpen: boolean
  onClose: () => void
  onPredictionSaved?: () => void
  session: Session
  meeting: Meeting
}

export default function PredictionModal({ isOpen, onClose, onPredictionSaved, session, meeting }: PredictionModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<(number | null)[]>(Array(10).fill(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const driversData = await getDriversForMeeting('latest')
        setDrivers(driversData)

        const existingPrediction = await getUserPrediction(meeting.id)
        if (existingPrediction) {
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
  }, [isOpen, meeting.id, meeting.meeting_key])

  const handleSelectDriver = (position: number, driverId: number | null) => {
    const newSelection = [...selectedDrivers]
    newSelection[position] = driverId
    setSelectedDrivers(newSelection)
  }

  const isDriverSelected = (driverId: number, currentPosition: number): boolean => {
    return selectedDrivers.some((selected, index) =>
      index !== currentPosition && selected === driverId
    )
  }

  const isValid = (): boolean => {
    if (selectedDrivers.some(id => id === null)) return false
    const uniqueIds = new Set(selectedDrivers.filter(id => id !== null))
    return uniqueIds.size === 10
  }

  const handleSubmit = async () => {
    if (!isValid()) return

    setSaving(true)
    setError(null)

    const driverIds = selectedDrivers.filter((id): id is number => id !== null)
    const result = await savePrediction(meeting.id, driverIds)

    setSaving(false)

    if (result.success) {
      setSuccess(true)
      onPredictionSaved?.()
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 1500)
    } else {
      setError(result.error || 'Failed to save prediction')
    }
  }

  const title = selectedDrivers.some(d => d !== null) ? 'Edit Your Prediction' : 'Make Your Prediction'
  const description = `${meeting.meeting_name} - ${session.session_name}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="lg"
      footer={
        <>
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
            className="flex-1 px-4 py-2 bg-f1-red hover:bg-f1-red-hover text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Submit Prediction'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          ✓ Prediction saved successfully!
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-f1-red"></div>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {selectedDrivers.map((selectedDriverId, position) => (
            <div key={position} className="flex items-center gap-3">
              <div className="w-12 text-center">
                <span className="font-bold text-gray-700">P{position + 1}</span>
              </div>
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
    </Modal>
  )
}
