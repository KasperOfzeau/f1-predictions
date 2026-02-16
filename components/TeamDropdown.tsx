'use client'

import { useState, useRef, useEffect } from 'react'

export interface TeamOption {
  name: string
  colour: string
}

interface TeamDropdownProps {
  teams: TeamOption[]
  selectedTeamName: string | null
  onSelect: (teamName: string | null) => void
}

export default function TeamDropdown({
  teams,
  selectedTeamName,
  onSelect,
}: TeamDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedTeam = teams.find((t) => t.name === selectedTeamName)

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
    <div className="relative flex-1 w-full min-w-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-left focus:ring-2 focus:ring-f1-red focus:border-transparent flex items-center gap-2"
      >
        {selectedTeam ? (
          <>
            <div
              className="w-3 h-3 rounded-full shrink-0 border border-gray-200"
              style={{ backgroundColor: `#${selectedTeam.colour}` }}
            />
            <span className="flex-1 truncate">{selectedTeam.name}</span>
          </>
        ) : (
          <span className="text-gray-500">Select team...</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
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

          {teams.map((team) => (
            <button
              key={team.name}
              type="button"
              onClick={() => {
                onSelect(team.name)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-2 text-left flex items-center gap-2 transition-colors hover:bg-gray-100 cursor-pointer ${
                selectedTeamName === team.name ? 'bg-red-50' : ''
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 border border-gray-200"
                style={{ backgroundColor: `#${team.colour}` }}
              />
              <span className="flex-1 text-left font-medium">{team.name}</span>
              {selectedTeamName === team.name && (
                <svg className="w-5 h-5 text-f1-red shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
