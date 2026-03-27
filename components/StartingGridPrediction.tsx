'use client'

import { useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Driver, Meeting, Session, Prediction } from '@/lib/types'
import { savePrediction } from '@/lib/services/predictions'

interface StartingGridPredictionProps {
  drivers: Driver[]
  meeting: Meeting
  session: Session
  existingPrediction: Prediction | null
  constructorStandingsOrder?: string[]
}

function normalizeTeamName(name: string): string {
  const normalized = name.toLowerCase().trim()

  if (normalized.includes('red bull')) return 'red-bull'
  if (normalized.includes('mclaren')) return 'mclaren'
  if (normalized.includes('ferrari')) return 'ferrari'
  if (normalized.includes('mercedes')) return 'mercedes'
  if (normalized.includes('aston martin')) return 'aston-martin'
  if (normalized.includes('alpine')) return 'alpine'
  if (normalized.includes('williams')) return 'williams'
  if (normalized.includes('haas')) return 'haas'
  if (normalized.includes('sauber') || normalized.includes('kick')) return 'sauber'
  if (normalized.includes('racing bulls') || normalized === 'rb' || normalized.includes('rb f1')) return 'racing-bulls'

  return normalized
}

function GridSpotFrame({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 121.36 174.03" className={className} fill="currentColor">
      <rect x="28.35" y="81.01" width="174.03" height="12" transform="translate(202.37 -28.35) rotate(90)" />
      <rect x="58.8" y="-58.28" width="4.28" height="120.83" transform="translate(63.08 -58.8) rotate(90)" />
      <rect x="58.28" y="111.47" width="4.28" height="120.83" transform="translate(232.3 111.47) rotate(90)" />
      <rect x="93.91" width="27.45" height="12" transform="translate(215.26 12) rotate(180)" />
      <rect x="93.91" y="162.03" width="27.45" height="12" transform="translate(215.26 336.05) rotate(180)" />
    </svg>
  )
}

function GridSpot({
  position,
  driver,
  isActive,
  onClick,
  orientation = 'right',
}: {
  position: number
  driver: Driver | null
  isActive: boolean
  onClick: () => void
  orientation?: 'right' | 'up'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative w-[82px] h-[116px] sm:w-[98px] sm:h-[138px] lg:w-[108px] lg:h-[152px] shrink-0
        transition-all duration-200 cursor-pointer group
        ${isActive ? 'scale-105' : 'hover:scale-[1.03]'}
      `}
    >
      <GridSpotFrame
        className={`absolute inset-0 w-full h-full transition-colors duration-200 ${
          isActive
            ? 'text-f1-red'
            : driver
              ? 'text-white'
              : 'text-white group-hover:text-white'
        } ${orientation === 'up' ? '-rotate-90' : ''}`}
      />

      <span
        className={`absolute z-10 top-0.5 left-1.5 sm:top-1.5 sm:left-2 text-xs sm:text-[10px] font-extrabold tracking-[0.18em] ${
          isActive ? 'text-f1-red' : 'text-white/60'
        }`}
      >
        P{position + 1}
      </span>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {driver ? (
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full overflow-hidden border-2 shrink-0"
              style={{ borderColor: `#${driver.team_colour}` }}
            >
              {driver.headshot_url ? (
                <Image
                  src={driver.headshot_url}
                  alt={driver.full_name}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: `#${driver.team_colour}30` }}
                >
                  {driver.name_acronym}
                </div>
              )}
            </div>
            <span className="text-[10px] sm:text-xs font-semibold text-white">{driver.name_acronym}</span>
            <span className="text-[8px] sm:text-[9px] text-white/40 leading-tight">#{driver.driver_number}</span>
          </div>
        ) : (
          <div
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
              isActive
                ? 'bg-f1-red text-white'
                : 'bg-f1-red/20 text-f1-red group-hover:bg-f1-red/30'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

function DriverDrawer({
  isOpen,
  activePosition,
  drivers,
  constructorStandingsOrder,
  selectedDrivers,
  onSelectDriver,
  onClose,
}: {
  isOpen: boolean
  activePosition: number | null
  drivers: Driver[]
  constructorStandingsOrder: string[]
  selectedDrivers: (number | null)[]
  onSelectDriver: (driverNumber: number) => void
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const teamGroups = useMemo(() => {
    const groups = new Map<string, { colour: string; drivers: Driver[] }>()
    drivers.forEach((d) => {
      const existing = groups.get(d.team_name)
      if (existing) {
        existing.drivers.push(d)
      } else {
        groups.set(d.team_name, { colour: d.team_colour, drivers: [d] })
      }
    })
    return Array.from(groups.entries())
      .map(([name, data]) => ({
        name,
        colour: data.colour,
        drivers: data.drivers,
      }))
      .sort((a, b) => {
        const aIndex = constructorStandingsOrder.indexOf(normalizeTeamName(a.name))
        const bIndex = constructorStandingsOrder.indexOf(normalizeTeamName(b.name))

        if (aIndex === -1 && bIndex === -1) {
          return a.name.localeCompare(b.name)
        }
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })
  }, [constructorStandingsOrder, drivers])

  const scroll = useCallback((direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -220 : 220,
      behavior: 'smooth',
    })
  }, [])

  const placedPositions = useMemo(() => {
    const map = new Map<number, number>()
    selectedDrivers.forEach((id, idx) => {
      if (id !== null) map.set(id, idx)
    })
    return map
  }, [selectedDrivers])

  return (
    <div className="border-t border-white/10 bg-black/70 backdrop-blur-md lg:bg-black/80">
      <div
        className="px-4 sm:px-6 lg:px-8 py-3.5 lg:py-4 flex items-center justify-between cursor-pointer"
        onClick={() => isOpen ? onClose() : undefined}
      >
        <span className="text-white/70 text-sm sm:text-[15px] lg:text-base">
          {activePosition !== null
            ? `Select driver for P${activePosition + 1}`
            : 'Tap a position on the grid to add a driver'}
        </span>
        {isOpen && (
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors p-1"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
          isOpen ? 'max-h-60 sm:max-h-64 lg:max-h-72' : 'max-h-0'
        }`}
      >
        <div className="relative px-4 sm:px-6 lg:px-8 pb-4 lg:pb-5">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-black/70 text-white/70 hover:text-white rounded-full transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-black/70 text-white/70 hover:text-white rounded-full transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div
            ref={scrollRef}
            className="flex gap-3.5 lg:gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 scroll-smooth"
          >
            {teamGroups.map((team) => (
              <div
                key={team.name}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-3 lg:p-3.5 min-w-[172px] sm:min-w-[176px] lg:min-w-[190px]"
              >
                <div className="flex items-center gap-2 mb-2.5 lg:mb-3">
                  <div
                    className="w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: `#${team.colour}` }}
                  />
                  <span className="text-sm lg:text-sm font-semibold text-white/80 truncate">{team.name}</span>
                </div>
                <div className="flex flex-col gap-2 lg:gap-2">
                  {team.drivers.map((driver) => {
                    const placedAt = placedPositions.get(driver.driver_number)
                    const isPlaced = placedAt !== undefined
                    return (
                  <button
                        key={driver.driver_number}
                        type="button"
                        onClick={() => onSelectDriver(driver.driver_number)}
                    className="flex items-center gap-2.5 lg:gap-2.5 rounded-lg px-2.5 py-1.5 lg:px-2.5 lg:py-1.5 transition-all cursor-pointer hover:bg-white/10"
                        style={{ borderLeft: `3px solid #${team.colour}` }}
                      >
                    <div className="w-7 h-7 lg:w-7 lg:h-7 rounded-full overflow-hidden shrink-0 bg-white/10">
                          {driver.headshot_url ? (
                            <Image
                              src={driver.headshot_url}
                              alt={driver.full_name}
                              width={28}
                              height={28}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">
                              {driver.name_acronym}
                            </div>
                          )}
                        </div>
                        <span className={`text-sm sm:text-sm lg:text-base font-medium flex-1 text-left ${isPlaced ? 'text-white/40' : 'text-white'}`}>
                          {driver.name_acronym}
                        </span>
                        {isPlaced && (
                          <span className="text-[10px] lg:text-xs text-white/30 font-medium">P{placedAt + 1}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StartingGridPrediction({
  drivers,
  meeting,
  session,
  existingPrediction,
  constructorStandingsOrder = [],
}: StartingGridPredictionProps) {
  const router = useRouter()

  const initialDrivers: (number | null)[] = existingPrediction
    ? [
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
      ]
    : Array(10).fill(null)

  const [selectedDrivers, setSelectedDrivers] = useState<(number | null)[]>(initialDrivers)
  const [activeSpot, setActiveSpot] = useState<number | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const driverMap = useMemo(() => {
    const map = new Map<number, Driver>()
    drivers.forEach((d) => map.set(d.driver_number, d))
    return map
  }, [drivers])

  const filledCount = selectedDrivers.filter((id) => id !== null).length
  const isComplete = filledCount === 10
  const isEditing = existingPrediction !== null

  const handleSpotClick = (position: number) => {
    if (activeSpot === position && drawerOpen) {
      setActiveSpot(null)
      setDrawerOpen(false)
    } else {
      setActiveSpot(position)
      setDrawerOpen(true)
    }
  }

  const handleSelectDriver = (driverNumber: number) => {
    if (activeSpot === null) return

    const newSelection = [...selectedDrivers]
    const existingIndex = newSelection.findIndex((id) => id === driverNumber)

    if (existingIndex !== -1 && existingIndex !== activeSpot) {
      newSelection[existingIndex] = newSelection[activeSpot]
    }

    newSelection[activeSpot] = driverNumber
    setSelectedDrivers(newSelection)
    setActiveSpot(null)
    setDrawerOpen(false)
  }

  const handleSubmit = async () => {
    if (!isComplete) return

    setSaving(true)
    setError(null)

    const driverIds = selectedDrivers.filter((id): id is number => id !== null)
    const result = await savePrediction(meeting.id, session.session_key, driverIds)

    setSaving(false)

    if (result.success) {
      setSuccess(true)
      setTimeout(() => router.push('/predictions'), 1200)
    } else {
      setError(result.error || 'Failed to save prediction')
    }
  }

  const pairs = [0, 1, 2, 3, 4]

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/predictions"
            className="text-white/50 hover:text-white transition-colors shrink-0"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-white">
              {meeting.meeting_name}
            </h1>
            <p className="text-xs sm:text-sm text-white/50">{session.session_name} prediction</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-start">
          <span className="text-sm text-white/50 tabular-nums">
            {filledCount}/10 positions
          </span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete || saving || success}
            className={`px-5 py-2 rounded-full font-medium text-sm transition-all ${
              isComplete && !saving && !success
                ? 'bg-f1-red text-white hover:bg-f1-red-hover cursor-pointer'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : success ? 'Saved!' : isEditing ? 'Update prediction' : 'Submit prediction'}
          </button>
        </div>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="mx-4 sm:mx-6 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Grid area */}
      <div>
        {/* Vertical grid (< lg): individual spots zigzagging left/right */}
        <div className="px-5 py-4 lg:hidden">
          <div className="mx-auto flex max-w-48 flex-col gap-2 sm:max-w-56">
            {Array.from({ length: 10 }, (_, i) => {
              const driver = selectedDrivers[i] !== null ? driverMap.get(selectedDrivers[i]!) ?? null : null
              return (
                <div
                  key={i}
                  className={i % 2 === 0 ? 'self-end' : 'self-start'}
                >
                  <GridSpot
                    position={i}
                    driver={driver}
                    isActive={activeSpot === i}
                    onClick={() => handleSpotClick(i)}
                    orientation="up"
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Horizontal grid (lg+): paired columns, P1 at right (front) */}
        <div className="hidden lg:flex overflow-x-auto scrollbar-hide px-8 py-4">
          <div className="flex flex-row-reverse gap-7 xl:gap-8 py-5 mx-auto">
            {pairs.map((pairIndex) => {
              const backPos = pairIndex * 2 + 1
              const frontPos = pairIndex * 2
              const backDriver = selectedDrivers[backPos] !== null ? driverMap.get(selectedDrivers[backPos]!) ?? null : null
              const frontDriver = selectedDrivers[frontPos] !== null ? driverMap.get(selectedDrivers[frontPos]!) ?? null : null

              return (
                <div
                  key={pairIndex}
                  className="flex flex-col gap-10 shrink-0"
                >
                  <div>
                    <GridSpot
                      position={backPos}
                      driver={backDriver}
                      isActive={activeSpot === backPos}
                      onClick={() => handleSpotClick(backPos)}
                    />
                  </div>
                  <div className="ml-11 xl:ml-12">
                    <GridSpot
                      position={frontPos}
                      driver={frontDriver}
                      isActive={activeSpot === frontPos}
                      onClick={() => handleSpotClick(frontPos)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Driver drawer */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <DriverDrawer
          isOpen={drawerOpen}
          activePosition={activeSpot}
          drivers={drivers}
          constructorStandingsOrder={constructorStandingsOrder}
          selectedDrivers={selectedDrivers}
          onSelectDriver={handleSelectDriver}
          onClose={() => {
            setDrawerOpen(false)
            setActiveSpot(null)
          }}
        />
      </div>
    </main>
  )
}
