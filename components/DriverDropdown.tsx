'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import type { Driver } from '@/lib/types'

interface DriverDropdownProps {
  drivers: Driver[]
  selectedDriverId: number | null
  onSelect: (driverId: number | null) => void
  isDriverDisabled: (driverId: number) => boolean
  position: number
}

export default function DriverDropdown({
  drivers,
  selectedDriverId,
  onSelect,
  isDriverDisabled,
  position,
}: DriverDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedDriver = drivers.find(d => d.driver_number === selectedDriverId)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-left focus:ring-2 focus:ring-[#ED1131] focus:border-transparent flex items-center gap-2"
      >
        {selectedDriver ? (
          <>
            {/* Selected Driver Avatar */}
            <div className="w-8 h-8 relative rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
              {selectedDriver.headshot_url ? (
                <Image
                  src={selectedDriver.headshot_url}
                  alt={selectedDriver.full_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {selectedDriver.name_acronym}
                </div>
              )}
            </div>
            {/* Team Color Indicator */}
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: `#${selectedDriver.team_colour}` }}
            />
            {/* Driver Info */}
            <span className="flex-1 truncate">
              #{selectedDriver.driver_number} {selectedDriver.full_name}
            </span>
          </>
        ) : (
          <span className="text-gray-500">Select driver...</span>
        )}
        {/* Dropdown Arrow */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {/* Clear Selection Option */}
          <button
            type="button"
            onClick={() => {
              onSelect(null)
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-500 text-sm"
          >
            Clear selection
          </button>

          {/* Driver Options */}
          {drivers.map((driver) => {
            const disabled = isDriverDisabled(driver.driver_number)
            return (
              <button
                key={driver.driver_number}
                type="button"
                onClick={() => {
                  if (!disabled) {
                    onSelect(driver.driver_number)
                    setIsOpen(false)
                  }
                }}
                disabled={disabled}
                className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : 'hover:bg-gray-100 cursor-pointer'
                } ${selectedDriverId === driver.driver_number ? 'bg-blue-50' : ''}`}
              >
                {/* Driver Avatar */}
                <div className="w-8 h-8 relative rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  {driver.headshot_url ? (
                    <Image
                      src={driver.headshot_url}
                      alt={driver.full_name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {driver.name_acronym}
                    </div>
                  )}
                </div>

                {/* Team Color Indicator */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `#${driver.team_colour}` }}
                />

                {/* Driver Info */}
                <div className="flex-1">
                  <div className="font-medium">
                    #{driver.driver_number} {driver.full_name}
                  </div>
                  <div className="text-xs text-gray-500">{driver.team_name}</div>
                </div>

                {/* Selected Checkmark */}
                {selectedDriverId === driver.driver_number && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
