'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import type { Driver } from '@/lib/types'
import { getDriversForMeeting, getTeamsFromDrivers, type TeamFromDrivers } from '@/lib/services/predictions'
import {
  getCurrentSeasonYear,
  getSeasonPrediction,
  saveSeasonPrediction,
} from '@/lib/services/seasonPredictions'
import DriverDropdown from './DriverDropdown'
import TeamDropdown from './TeamDropdown'

interface SeasonPredictionsBlockProps {
  show: boolean
}

export default function SeasonPredictionsBlock({ show }: SeasonPredictionsBlockProps) {
  const [popupOpen, setPopupOpen] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [teams, setTeams] = useState<TeamFromDrivers[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasExistingPrediction, setHasExistingPrediction] = useState(false)

  // Constructors' championship
  const [constructorsFirst, setConstructorsFirst] = useState('')
  const [constructorsSecond, setConstructorsSecond] = useState('')
  const [constructorsThird, setConstructorsThird] = useState('')
  // Fastest pit stop
  const [fastestPitstopTeam, setFastestPitstopTeam] = useState('')
  // Drivers' championship (driver_number)
  const [driversFirst, setDriversFirst] = useState<number | null>(null)
  const [driversSecond, setDriversSecond] = useState<number | null>(null)
  const [driversThird, setDriversThird] = useState<number | null>(null)
  // DNFs
  const [mostDnfs, setMostDnfs] = useState<number | null>(null)
  const [fewestDnfs, setFewestDnfs] = useState<number | null>(null)
  // Safety cars
  const [safetyCarCount, setSafetyCarCount] = useState<string>('')
  // Overtakes
  const [mostOvertakes, setMostOvertakes] = useState<number | null>(null)
  const [fewestOvertakes, setFewestOvertakes] = useState<number | null>(null)

  // Check if user already has a season prediction (for button label)
  useEffect(() => {
    if (!show) return
    let cancelled = false
    getSeasonPrediction(getCurrentSeasonYear()).then((existing) => {
      if (!cancelled) setHasExistingPrediction(!!existing)
    })
    return () => { cancelled = true }
  }, [show])

  useEffect(() => {
    if (!popupOpen) return
    let cancelled = false
    setLoadError(null)
    setSaveError(null)
    setSaveSuccess(false)
    setLoading(true)
    const seasonYear = getCurrentSeasonYear()
    Promise.all([getDriversForMeeting('latest'), getSeasonPrediction(seasonYear)])
      .then(([driversData, existing]) => {
        if (cancelled) return
        setDrivers(driversData)
        setTeams(getTeamsFromDrivers(driversData))
        if (existing) {
          setHasExistingPrediction(true)
          setConstructorsFirst(existing.constructors_1st ?? '')
          setConstructorsSecond(existing.constructors_2nd ?? '')
          setConstructorsThird(existing.constructors_3rd ?? '')
          setFastestPitstopTeam(existing.fastest_pitstop_team ?? '')
          setDriversFirst(existing.drivers_1st ?? null)
          setDriversSecond(existing.drivers_2nd ?? null)
          setDriversThird(existing.drivers_3rd ?? null)
          setMostDnfs(existing.most_dnfs_driver ?? null)
          setFewestDnfs(existing.fewest_dnfs_driver ?? null)
          setSafetyCarCount(
            existing.safety_car_count != null ? String(existing.safety_car_count) : ''
          )
          setMostOvertakes(existing.most_overtakes_driver ?? null)
          setFewestOvertakes(existing.fewest_overtakes_driver ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Failed to load drivers and teams. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [popupOpen])

  if (!show) return null

  return (
    <>
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-xl font-bold text-carbon-black mb-2">Season predictions ({getCurrentSeasonYear()})</h3>
        <p className="text-gray-600 text-sm mb-4">
          Make your predictions for the season before the first race weekend starts.
        </p>
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="bg-f1-red hover:bg-f1-red-hover text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          {hasExistingPrediction ? 'Edit season prediction' : 'Make season predictions'}
        </button>
      </div>

      <Modal
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        title="Season predictions"
        description={`Season ${getCurrentSeasonYear()} — all fields are optional.`}
        size="lg"
        className="max-h-[90vh]"
        footer={
          saveSuccess ? (
            <div className="flex gap-3 w-full justify-end">
              <button
                type="button"
                onClick={() => {
                  setPopupOpen(false)
                  setSaveSuccess(false)
                }}
                className="px-4 py-2 bg-f1-red hover:bg-f1-red-hover text-white rounded-md font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
          <div className="flex gap-3 w-full justify-end">
            <button
              type="button"
              onClick={() => setPopupOpen(false)}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaveError(null)
                setSaving(true)
                const seasonYear = getCurrentSeasonYear()
                const result = await saveSeasonPrediction(seasonYear, {
                  constructorsFirst,
                  constructorsSecond,
                  constructorsThird,
                  fastestPitstopTeam,
                  driversFirst,
                  driversSecond,
                  driversThird,
                  mostDnfs,
                  fewestDnfs,
                  safetyCarCount:
                  safetyCarCount === ''
                    ? null
                    : (() => {
                        const n = parseInt(safetyCarCount, 10)
                        return Number.isNaN(n) ? null : n
                      })(),
                  mostOvertakes,
                  fewestOvertakes,
                })
                setSaving(false)
                if (result.success) {
                  setHasExistingPrediction(true)
                  setSaveSuccess(true)
                } else {
                  setSaveError(result.error ?? 'Failed to save')
                }
              }}
              className="px-4 py-2 bg-f1-red hover:bg-f1-red-hover text-white rounded-md font-medium disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save predictions'}
            </button>
          </div>
          )
        }
      >
        {saveSuccess ? (
          <div className="py-6 px-2 text-center">
            <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-5 rounded-lg inline-block text-left max-w-md">
              <p className="font-medium">Your season predictions have been saved!.</p>
              <p className="mt-2 text-sm text-green-700">
                At the end of the season you can view the results and see how many points you scored.
                You can edit your predictions until the season starts.
              </p>
            </div>
          </div>
        ) : (
          <>
        {loadError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {loadError}
          </div>
        )}
        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {saveError}
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-f1-red" />
          </div>
        )}

        {!loading && (
        <div className="space-y-6">
          {/* Constructors' championship */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              Constructors&apos; championship
            </h4>
            <div className="space-y-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which team wins the constructors&apos; championship?
                </label>
                <TeamDropdown
                  teams={teams}
                  selectedTeamName={constructorsFirst || null}
                  onSelect={(name) => setConstructorsFirst(name ?? '')}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which team finishes second in the constructors&apos; championship?
                </label>
                <TeamDropdown
                  teams={teams}
                  selectedTeamName={constructorsSecond || null}
                  onSelect={(name) => setConstructorsSecond(name ?? '')}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which team finishes third in the constructors&apos; championship?
                </label>
                <TeamDropdown
                  teams={teams}
                  selectedTeamName={constructorsThird || null}
                  onSelect={(name) => setConstructorsThird(name ?? '')}
                />
              </div>
            </div>
          </section>

          {/* Drivers' championship */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              Drivers&apos; championship
            </h4>
            <div className="space-y-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which driver wins the drivers&apos; championship?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={driversFirst}
                  onSelect={setDriversFirst}
                  isDriverDisabled={() => false}
                  position={0}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which driver finishes second in the drivers&apos; championship?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={driversSecond}
                  onSelect={setDriversSecond}
                  isDriverDisabled={() => false}
                  position={1}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which driver finishes third in the drivers&apos; championship?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={driversThird}
                  onSelect={setDriversThird}
                  isDriverDisabled={() => false}
                  position={2}
                />
              </div>
            </div>
          </section>

            {/* Fastest pit stop */}
            <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              Pit stops
            </h4>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Which team has the fastest pit stop of the season?
              </label>
              <TeamDropdown
                teams={teams}
                selectedTeamName={fastestPitstopTeam || null}
                onSelect={(name) => setFastestPitstopTeam(name ?? '')}
              />
            </div>
          </section>

          {/* DNFs */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              DNFs (Did not finish)
            </h4>
            <div className="space-y-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which driver has the most DNFs this season?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={mostDnfs}
                  onSelect={setMostDnfs}
                  isDriverDisabled={() => false}
                  position={0}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Which driver has the fewest DNFs?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={fewestDnfs}
                  onSelect={setFewestDnfs}
                  isDriverDisabled={() => false}
                  position={1}
                />
              </div>
            </div>
          </section>

          {/* Safety cars */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              Safety cars
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                How many safety cars will be deployed this season?
              </label>
              <input
                type="number"
                min={0}
                max={99}
                value={safetyCarCount}
                onChange={(e) => setSafetyCarCount(e.target.value)}
                placeholder="e.g. 25"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-f1-red focus:border-transparent"
              />
            </div>
          </section>

          {/* Overtakes */}
          <section>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 border-b border-gray-200 pb-1">
              Overtakes
            </h4>
            <div className="space-y-3">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Who makes the most overtakes?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={mostOvertakes}
                  onSelect={setMostOvertakes}
                  isDriverDisabled={() => false}
                  position={0}
                />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Who makes the fewest overtakes?
                </label>
                <DriverDropdown
                  drivers={drivers}
                  selectedDriverId={fewestOvertakes}
                  onSelect={setFewestOvertakes}
                  isDriverDisabled={() => false}
                  position={1}
                />
              </div>
            </div>
          </section>
        </div>
        )}
          </>
        )}
      </Modal>
    </>
  )
}
