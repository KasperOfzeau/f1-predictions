import Image from 'next/image'
import type { Race } from '@/lib/types'

interface NextRaceCardProps {
  race: Race
}

const tz = 'Europe/Amsterdam'
const shortDateOpts: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: tz,
}
const withYear: Intl.DateTimeFormatOptions = { ...shortDateOpts, year: 'numeric' }

export default function NextRaceCard({ race }: NextRaceCardProps) {
  const raceStartDate = new Date(race.date_start)
  const raceEndDate = new Date(race.date_end)
  const now = new Date()
  const daysUntil = Math.ceil((raceStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-[#ED1131] to-[#C00E28]">
        {race.circuit_image && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={race.circuit_image}
              alt={race.circuit_short_name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <p className="text-sm font-medium uppercase tracking-wide">Next race weekend</p>
            <h3 className="text-2xl font-bold mt-1">{race.meeting_name}</h3>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {race.country_flag && (
              <div className="relative w-12 h-8 rounded overflow-hidden border border-gray-200">
                <Image
                  src={race.country_flag}
                  alt={race.country_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{race.country_name}</p>
              <p className="text-sm text-gray-600">{race.circuit_short_name}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-[#ED1131]">{daysUntil}</p>
            <p className="text-xs text-gray-600">days to go</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">
            {raceStartDate.toLocaleDateString('en-GB', shortDateOpts)} – {raceEndDate.toLocaleDateString('en-GB', withYear)}
          </span>
        </p>

        {/* <button className="w-full mt-4 bg-[#ED1131] hover:bg-[#C00E28] text-white px-4 py-2 rounded-md font-medium transition-colors">
          Make Prediction
        </button> */}
      </div>
    </div>
  )
}
