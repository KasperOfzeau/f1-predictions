'use client'

import { useState, useEffect } from 'react'
import type { Driver } from '@/lib/types'
import type { SeasonPrediction } from '@/lib/types'
import { getDriversForMeeting } from '@/lib/services/predictions'
import Modal from './Modal'

interface SeasonPredictionViewModalProps {
  isOpen: boolean
  onClose: () => void
  seasonPrediction: SeasonPrediction
  seasonYear: number
}

function driverName(drivers: Driver[], driverNumber: number | null): string {
  if (driverNumber == null) return '—'
  const d = drivers.find((x) => x.driver_number === driverNumber)
  return d ? d.name_acronym : `#${driverNumber}`
}

export default function SeasonPredictionViewModal({
  isOpen,
  onClose,
  seasonPrediction,
  seasonYear,
}: SeasonPredictionViewModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    getDriversForMeeting('latest')
      .then((list) => {
        if (!cancelled) setDrivers(list)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isOpen])

  const hasAny =
    seasonPrediction.constructors_1st ||
    seasonPrediction.constructors_2nd ||
    seasonPrediction.constructors_3rd ||
    seasonPrediction.fastest_pitstop_team ||
    seasonPrediction.drivers_1st != null ||
    seasonPrediction.drivers_2nd != null ||
    seasonPrediction.drivers_3rd != null ||
    seasonPrediction.most_dnfs_driver != null ||
    seasonPrediction.fewest_dnfs_driver != null ||
    seasonPrediction.safety_car_count != null ||
    seasonPrediction.most_overtakes_driver != null ||
    seasonPrediction.fewest_overtakes_driver != null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Season prediction ${seasonYear}`}
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
      {!hasAny && (
        <p className="text-zinc-500 text-sm py-4">No season predictions saved yet.</p>
      )}
      {hasAny && (
        <div className="space-y-4 text-sm">
          {(seasonPrediction.constructors_1st ||
            seasonPrediction.constructors_2nd ||
            seasonPrediction.constructors_3rd) && (
            <section>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Constructors&apos; championship
              </h4>
              <ul className="space-y-1 text-carbon-black">
                {seasonPrediction.constructors_1st && (
                  <li>1st: {seasonPrediction.constructors_1st}</li>
                )}
                {seasonPrediction.constructors_2nd && (
                  <li>2nd: {seasonPrediction.constructors_2nd}</li>
                )}
                {seasonPrediction.constructors_3rd && (
                  <li>3rd: {seasonPrediction.constructors_3rd}</li>
                )}
              </ul>
            </section>
          )}
          {(seasonPrediction.drivers_1st != null ||
            seasonPrediction.drivers_2nd != null ||
            seasonPrediction.drivers_3rd != null) && (
            <section>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Drivers&apos; championship
              </h4>
              <ul className="space-y-1 text-carbon-black">
                {seasonPrediction.drivers_1st != null && (
                  <li>1st: {driverName(drivers, seasonPrediction.drivers_1st)}</li>
                )}
                {seasonPrediction.drivers_2nd != null && (
                  <li>2nd: {driverName(drivers, seasonPrediction.drivers_2nd)}</li>
                )}
                {seasonPrediction.drivers_3rd != null && (
                  <li>3rd: {driverName(drivers, seasonPrediction.drivers_3rd)}</li>
                )}
              </ul>
            </section>
          )}
          {seasonPrediction.fastest_pitstop_team && (
            <section>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Fastest pit stop
              </h4>
              <p className="text-carbon-black">{seasonPrediction.fastest_pitstop_team}</p>
            </section>
          )}
          {(seasonPrediction.most_dnfs_driver != null ||
            seasonPrediction.fewest_dnfs_driver != null) && (
            <section>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                DNFs
              </h4>
              <ul className="space-y-1 text-carbon-black">
                {seasonPrediction.most_dnfs_driver != null && (
                  <li>Most DNFs: {driverName(drivers, seasonPrediction.most_dnfs_driver)}</li>
                )}
                {seasonPrediction.fewest_dnfs_driver != null && (
                  <li>Fewest DNFs: {driverName(drivers, seasonPrediction.fewest_dnfs_driver)}</li>
                )}
              </ul>
            </section>
          )}
          {seasonPrediction.safety_car_count != null && (
            <section>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Safety cars
              </h4>
              <p className="text-carbon-black">{seasonPrediction.safety_car_count}</p>
            </section>
          )}
          {(seasonPrediction.most_overtakes_driver != null ||
            seasonPrediction.fewest_overtakes_driver != null) && (
            <section>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">
                Overtakes
              </h4>
              <ul className="space-y-1 text-carbon-black">
                {seasonPrediction.most_overtakes_driver != null && (
                  <li>Most: {driverName(drivers, seasonPrediction.most_overtakes_driver)}</li>
                )}
                {seasonPrediction.fewest_overtakes_driver != null && (
                  <li>Fewest: {driverName(drivers, seasonPrediction.fewest_overtakes_driver)}</li>
                )}
              </ul>
            </section>
          )}
          {seasonPrediction.points != null && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-zinc-500 font-medium">Season points: </span>
              <span className="font-bold text-carbon-black">{seasonPrediction.points} pts</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
