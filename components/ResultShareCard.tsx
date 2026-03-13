'use client'

import type { Driver, Prediction } from '@/lib/types'

type ResultStatus = 'correct' | 'in_top10' | 'wrong'

interface ResultShareCardProps {
  meetingName: string
  resultOrder: number[]
  prediction: Prediction
  drivers: Driver[]
  points: number | null
}

function getStatus(
  predictedDriver: number,
  actualDriver: number,
  resultOrder: number[]
): ResultStatus {
  if (predictedDriver === actualDriver) return 'correct'
  if (resultOrder.includes(predictedDriver)) return 'in_top10'
  return 'wrong'
}

function getStatusBorderColor(status: ResultStatus): string {
  switch (status) {
    case 'correct':
      return '#10b981'
    case 'in_top10':
      return '#f59e0b'
    case 'wrong':
      return '#ef4444'
  }
}

function getPointsForStatus(status: ResultStatus): number {
  switch (status) {
    case 'correct':
      return 5
    case 'in_top10':
      return 1
    case 'wrong':
      return 0
  }
}

function driverByNumber(drivers: Driver[], driverNumber: number): Driver | undefined {
  return drivers.find((d) => d.driver_number === driverNumber)
}

export const SHARE_CARD_WIDTH = 1080
export const SHARE_CARD_HEIGHT = 1920

export default function ResultShareCard({
  meetingName,
  resultOrder,
  prediction,
  drivers,
  points,
}: ResultShareCardProps) {
  const predOrder = [
    prediction.position_1,
    prediction.position_2,
    prediction.position_3,
    prediction.position_4,
    prediction.position_5,
    prediction.position_6,
    prediction.position_7,
    prediction.position_8,
    prediction.position_9,
    prediction.position_10,
  ]
  const rows = resultOrder.map((driverNumber, index) => {
    const predictedDriver = predOrder[index] ?? null
    const status =
      predictedDriver != null
        ? getStatus(predictedDriver, driverNumber, resultOrder)
        : null

    return {
      position: index + 1,
      actualDriver: driverByNumber(drivers, driverNumber),
      predictedDriverInfo: predictedDriver != null ? driverByNumber(drivers, predictedDriver) : null,
      driverNumber,
      status,
      rowPoints: status != null ? getPointsForStatus(status) : null,
    }
  })
  const correctCount = rows.filter((row) => row.status === 'correct').length
  const inTop10Count = rows.filter((row) => row.status === 'in_top10').length

  function getStatusTextColor(status: ResultStatus | null): string {
    switch (status) {
      case 'correct':
        return '#34d399'
      case 'in_top10':
        return '#fbbf24'
      case 'wrong':
        return '#f87171'
      default:
        return 'rgba(255,255,255,0.4)'
    }
  }

  function getStatusRowBackground(status: ResultStatus | null): string {
    switch (status) {
      case 'correct':
        return 'rgba(16,185,129,0.12)'
      case 'in_top10':
        return 'rgba(245,158,11,0.10)'
      case 'wrong':
        return 'rgba(239,68,68,0.10)'
      default:
        return 'rgba(255,255,255,0.03)'
    }
  }

  return (
    <div
      style={{
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        boxSizing: 'border-box',
        backgroundColor: '#15151E',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Open Sans", ui-sans-serif, system-ui, sans-serif',
        color: '#ffffff',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div style={{ padding: '64px 56px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 24,
            paddingTop: 96,
            marginBottom: 48,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 52,
                fontWeight: 700,
                margin: 0,
                marginBottom: 12,
              }}
            >
              {meetingName}
            </h1>
            <p
              style={{
                fontSize: 38,
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
              }}
            >
              My prediction
            </p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 179.03 56.27"
            style={{ width: 220, height: 'auto', flexShrink: 0, marginTop: 6 }}
          >
            <g>
              <path fill="#fff" d="M72.36,10.96c.2,0,.43.01.69.03s.47.05.64.08l-.3,3.67c-.13-.04-.31-.07-.55-.1-.24-.02-.44-.03-.61-.03-.51,0-1,.06-1.47.19s-.9.34-1.28.62-.67.66-.89,1.13-.33,1.04-.33,1.71v7.31h-3.92v-14.36h2.97l.58,2.41h.19c.28-.49.64-.93,1.06-1.34s.91-.73,1.45-.98c.54-.25,1.13-.37,1.77-.37Z"/>
              <path fill="#fff" d="M82.22,10.96c1.33,0,2.47.26,3.43.76.96.51,1.7,1.25,2.22,2.22s.78,2.15.78,3.55v1.9h-9.26c.04,1.1.37,1.97,1,2.6.62.63,1.48.94,2.59.94.92,0,1.76-.09,2.52-.28s1.55-.47,2.35-.85v3.03c-.71.35-1.45.61-2.23.77s-1.71.24-2.82.24c-1.44,0-2.71-.27-3.82-.8s-1.98-1.34-2.61-2.43-.94-2.46-.94-4.11.28-3.08.85-4.19c.57-1.12,1.36-1.96,2.38-2.52,1.02-.56,2.21-.84,3.56-.84ZM82.24,13.74c-.76,0-1.39.24-1.89.73s-.79,1.25-.87,2.3h5.5c0-.58-.11-1.1-.31-1.55s-.5-.81-.9-1.08-.91-.4-1.52-.4Z"/>
              <path fill="#fff" d="M96.38,25.84c-1.6,0-2.91-.63-3.91-1.88s-1.51-3.1-1.51-5.53.51-4.32,1.53-5.58c1.02-1.26,2.35-1.89,3.99-1.89.69,0,1.29.09,1.81.28s.97.44,1.36.76.7.67.97,1.07h.13c-.05-.27-.11-.68-.19-1.21-.07-.53-.11-1.08-.11-1.65v-4.6h3.93v19.99h-3.01l-.76-1.86h-.17c-.25.39-.56.75-.93,1.07-.37.32-.82.58-1.33.77s-1.12.28-1.81.28ZM97.76,22.72c1.07,0,1.83-.32,2.27-.96.44-.64.67-1.6.7-2.88v-.42c0-1.4-.21-2.46-.64-3.2s-1.22-1.11-2.39-1.11c-.86,0-1.54.37-2.03,1.12s-.73,1.82-.73,3.22.25,2.46.74,3.17,1.19,1.07,2.09,1.07Z"/>
              <path fill="#fff" d="M110.45,5.6c.58,0,1.08.13,1.5.41.42.27.63.77.63,1.51s-.21,1.23-.63,1.51c-.42.28-.92.42-1.5.42s-1.09-.14-1.51-.42c-.42-.28-.62-.78-.62-1.51s.21-1.24.62-1.51c.42-.27.92-.41,1.51-.41ZM112.4,11.23v14.36h-3.92v-14.36h3.92Z"/>
              <path fill="#fff" d="M122.34,25.84c-1.42,0-2.63-.26-3.64-.78s-1.76-1.32-2.29-2.41-.78-2.48-.78-4.17.3-3.19.89-4.3c.6-1.11,1.42-1.92,2.48-2.45s2.28-.78,3.68-.78c.99,0,1.85.1,2.58.29.72.19,1.36.42,1.89.69l-1.16,3.03c-.62-.25-1.19-.45-1.72-.61s-1.06-.24-1.59-.24c-.69,0-1.25.16-1.71.48-.45.32-.79.8-1.01,1.45s-.33,1.45-.33,2.41.12,1.74.36,2.36.59,1.09,1.04,1.39,1.01.46,1.66.46c.81,0,1.54-.11,2.17-.33.63-.22,1.25-.53,1.85-.92v3.35c-.6.38-1.23.65-1.88.81-.66.17-1.48.25-2.49.25Z"/>
              <path fill="#fff" d="M136.09,22.72c.43,0,.85-.04,1.25-.13s.81-.19,1.21-.32v2.92c-.42.19-.94.35-1.56.47-.62.12-1.3.19-2.04.19-.86,0-1.62-.14-2.31-.42-.68-.28-1.22-.76-1.61-1.45-.39-.69-.58-1.65-.58-2.88v-6.92h-1.88v-1.66l2.16-1.31,1.13-3.03h2.5v3.06h4.02v2.94h-4.02v6.92c0,.55.16.96.47,1.23.31.27.73.4,1.24.4Z"/>
              <path fill="#fff" d="M143.42,5.6c.58,0,1.08.13,1.5.41.42.27.63.77.63,1.51s-.21,1.23-.63,1.51c-.42.28-.92.42-1.5.42s-1.09-.14-1.51-.42c-.42-.28-.62-.78-.62-1.51s.21-1.24.62-1.51c.42-.27.92-.41,1.51-.41ZM145.38,11.23v14.36h-3.92v-14.36h3.92Z"/>
              <path fill="#fff" d="M162.54,18.38c0,1.2-.16,2.26-.48,3.19s-.79,1.71-1.4,2.34-1.35,1.12-2.21,1.44-1.83.49-2.91.49c-1.01,0-1.94-.16-2.78-.49s-1.58-.81-2.2-1.44-1.1-1.42-1.44-2.34-.51-1.99-.51-3.19c0-1.59.28-2.94.85-4.05s1.37-1.94,2.41-2.52,2.29-.86,3.74-.86c1.34,0,2.54.29,3.58.86s1.86,1.41,2.45,2.52.89,2.45.89,4.05ZM152.61,18.38c0,.94.1,1.73.31,2.38s.53,1.13.96,1.45,1.01.49,1.71.49,1.26-.16,1.69-.49.75-.81.95-1.45.3-1.43.3-2.38-.1-1.74-.3-2.37c-.2-.63-.52-1.1-.96-1.42s-1.01-.48-1.71-.48c-1.04,0-1.79.36-2.25,1.07s-.7,1.78-.7,3.2Z"/>
              <path fill="#fff" d="M173.93,10.96c1.53,0,2.77.42,3.7,1.25.93.84,1.4,2.17,1.4,4.01v9.36h-3.92v-8.39c0-1.03-.19-1.8-.56-2.33s-.96-.78-1.75-.78c-1.2,0-2.02.41-2.45,1.22s-.66,1.99-.66,3.52v6.76h-3.92v-14.36h2.99l.53,1.84h.22c.31-.5.69-.9,1.15-1.21s.97-.54,1.53-.68,1.14-.22,1.74-.22Z"/>
              <path fill="#fff" fillOpacity={0.8} d="M42.9,37.24c1.93,0,3.4.42,4.43,1.26s1.54,2.12,1.54,3.83v9.57h-2.74l-.76-1.95h-.1c-.41.51-.83.93-1.26,1.26s-.92.57-1.48.72-1.23.23-2.03.23c-.85,0-1.61-.16-2.28-.49s-1.2-.82-1.59-1.5-.58-1.53-.58-2.56c0-1.52.54-2.65,1.61-3.37s2.68-1.12,4.82-1.2l2.49-.08v-.63c0-.75-.2-1.31-.59-1.66s-.94-.53-1.64-.53-1.37.1-2.04.3-1.34.45-2,.75l-1.3-2.65c.76-.4,1.62-.72,2.56-.95s1.92-.35,2.94-.35ZM44.98,45.24l-1.52.05c-1.27.03-2.15.26-2.64.68s-.74.97-.74,1.66c0,.6.18,1.03.53,1.28s.81.38,1.37.38c.84,0,1.55-.25,2.13-.75s.87-1.2.87-2.12v-1.18Z"/>
              <path fill="#fff" fillOpacity={0.8} d="M57.45,52.15c-1.6,0-2.91-.63-3.91-1.88s-1.51-3.1-1.51-5.53.51-4.32,1.53-5.58c1.02-1.26,2.35-1.89,3.99-1.89.69,0,1.29.09,1.81.28s.97.44,1.36.76.7.67.97,1.07h.13c-.05-.27-.11-.68-.19-1.21-.07-.53-.11-1.08-.11-1.65v-4.6h3.93v19.99h-3.01l-.76-1.86h-.17c-.25.39-.56.75-.93,1.07-.37.32-.82.58-1.33.77s-1.12.28-1.81.28ZM58.82,49.03c1.07,0,1.83-.32,2.27-.96.44-.64.67-1.6.7-2.88v-.42c0-1.4-.21-2.46-.64-3.2s-1.22-1.11-2.39-1.11c-.86,0-1.54.37-2.03,1.12s-.73,1.82-.73,3.22.25,2.46.74,3.17,1.19,1.07,2.09,1.07Z"/>
              <path fill="#fff" fillOpacity={0.8} d="M74.1,52.15c-1.6,0-2.91-.63-3.91-1.88s-1.51-3.1-1.51-5.53.51-4.32,1.53-5.58c1.02-1.26,2.35-1.89,3.99-1.89.69,0,1.29.09,1.81.28s.97.44,1.36.76.7.67.97,1.07h.13c-.05-.27-.11-.68-.19-1.21-.07-.53-.11-1.08-.11-1.65v-4.6h3.93v19.99h-3.01l-.76-1.86h-.17c-.25.39-.56.75-.93,1.07-.37.32-.82.58-1.33.77s-1.12.28-1.81.28ZM75.47,49.03c1.07,0,1.83-.32,2.27-.96.44-.64.67-1.6.7-2.88v-.42c0-1.4-.21-2.46-.64-3.2s-1.22-1.11-2.39-1.11c-.86,0-1.54.37-2.03,1.12s-.73,1.82-.73,3.22.25,2.46.74,3.17,1.19,1.07,2.09,1.07Z"/>
              <path fill="#fff" fillOpacity={0.8} d="M99.25,44.69c0,1.2-.16,2.26-.48,3.19s-.79,1.71-1.4,2.34-1.35,1.12-2.21,1.44-1.83.49-2.91.49c-1.01,0-1.94-.16-2.78-.49s-1.58-.81-2.2-1.44-1.1-1.42-1.44-2.34-.51-1.99-.51-3.19c0-1.59.28-2.94.85-4.05s1.37-1.94,2.41-2.52,2.29-.86,3.74-.86c1.34,0,2.54.29,3.58.86s1.86,1.41,2.45,2.52.89,2.45.89,4.05ZM89.32,44.69c0,.94.1,1.73.31,2.38s.53,1.13.96,1.45,1.01.49,1.71.49,1.26-.16,1.69-.49.75-.81.95-1.45.3-1.43.3-2.38-.1-1.74-.3-2.37c-.2-.63-.52-1.1-.96-1.42s-1.01-.48-1.71-.48c-1.04,0-1.79.36-2.25,1.07s-.7,1.78-.7,3.2Z"/>
              <path fill="#fff" fillOpacity={0.8} d="M108.32,52.15c-1.42,0-2.63-.26-3.64-.78s-1.76-1.32-2.29-2.41-.78-2.48-.78-4.17.3-3.19.89-4.3c.6-1.11,1.42-1.92,2.48-2.45s2.28-.78,3.68-.78c.99,0,1.85.1,2.58.29.72.19,1.36.42,1.89.69l-1.16,3.03c-.62-.25-1.19-.45-1.72-.61s-1.06-.24-1.59-.24c-.69,0-1.25.16-1.71.48-.45.32-.79.8-1.01,1.45s-.33,1.45-.33,2.41.12,1.74.36,2.36.59,1.09,1.04,1.39,1.01.46,1.66.46c.81,0,1.54-.11,2.17-.33.63-.22,1.25-.53,1.85-.92v3.35c-.6.38-1.23.65-1.88.81-.66.17-1.48.25-2.49.25Z"/>
              <path fill="#fff" fillOpacity={0.8} d="M119.93,31.91v8.94c0,.54-.02,1.08-.06,1.62s-.09,1.08-.14,1.62h.05c.27-.38.54-.75.82-1.12s.58-.72.89-1.07l4.02-4.37h4.42l-5.7,6.23,6.05,8.13h-4.52l-4.14-5.82-1.68,1.35v4.47h-3.92v-19.99h3.92Z"/>
            </g>
            <polygon fill="#fff" fillOpacity={0.9} points="25.92 0 25.06 7.04 17.74 7.04 18.6 0 25.92 0"/>
            <polygon fill="#fff" fillOpacity={0.8} points="16.31 7.64 15.53 14.09 8.82 14.09 9.6 7.64 16.31 7.64"/>
            <polygon fill="#fff" fillOpacity={0.9} points="24.2 14.09 23.34 21.13 16.02 21.13 16.88 14.09 24.2 14.09"/>
            <polygon fill="#fff" fillOpacity={0.8} points="14.96 21.62 14.22 27.69 7.91 27.69 8.65 21.62 14.96 21.62"/>
            <polygon fill="#fff" fillOpacity={0.9} points="22.51 28.18 21.66 35.22 14.34 35.22 15.19 28.18 22.51 28.18"/>
            <polygon fill="#fff" fillOpacity={0.8} points="13.51 35.47 12.71 42.06 5.85 42.06 6.65 35.47 13.51 35.47"/>
            <polygon fill="#fff" fillOpacity={0.9} points="20.85 42.27 20 49.31 12.68 49.31 13.53 42.27 20.85 42.27"/>
            <polygon fill="#fff" fillOpacity={0.5} points="4.76 44.3 4.26 48.7 0 48.7 .5 44.3 4.76 44.3"/>
            <polygon fill="#fff" fillOpacity={0.8} points="11.51 49.52 10.85 55.34 5.21 55.34 5.86 49.52 11.51 49.52"/>
            <polygon fill="#fff" fillOpacity={0.5} points="6.44 28.74 5.81 34.66 .38 34.66 1.01 28.74 6.44 28.74"/>
            <polygon fill="#fff" fillOpacity={0.5} points="8.97 1.41 8.5 5.64 4.4 5.64 4.88 1.41 8.97 1.41"/>
            <path fill="#fff" d="M55.11,4.19C52.12,1.4,47.37,0,40.87,0h-14.97l-6.81,56.27h11.32l2.69-23.81h6.94c3.68,0,6.77-.45,9.27-1.36,2.5-.91,4.51-2.14,6.01-3.7,1.5-1.56,2.59-3.35,3.26-5.36.67-2.01,1-4.12,1-6.32,0-4.89-1.49-8.74-4.48-11.53ZM28.16,48.7h-5.64l.66-5.83h5.64l-.66,5.83ZM29.6,34.08h-5.1l.59-5.27h5.1l-.59,5.27ZM30.87,20.01h-4.65l.54-4.81h4.65l-.54,4.81ZM32.99,7.04h-5.64l.66-5.83h5.64l-.66,5.83ZM47.59,20.43c-.8,1.13-1.94,1.95-3.41,2.48-1.47.53-3.2.79-5.2.79h-5.2l1.68-14.95h4.86c2.89,0,5.03.6,6.41,1.81s2.07,3.05,2.07,5.53c0,1.77-.4,3.22-1.21,4.34Z"/>
            <polygon fill="#fff" fillOpacity={0.5} points="6.69 15.92 6.24 20.13 2.38 20.13 2.83 15.92 6.69 15.92"/>
          </svg>
        </div>

        <div
          style={{
            marginBottom: 36,
            padding: '48px 48px 48px',
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
          }}
        >
          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 12,
            }}
          >
            Race score
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 16 }}>
            <div
              style={{
                flex: '0 0 50%',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 88,
                  lineHeight: 1,
                  fontWeight: 800,
                }}
              >
                {points != null ? `${points}` : '—'}
                <span style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.65)', marginLeft: 12 }}>
                  pts
                </span>
              </div>
            </div>
            <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.24)',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 38, color: 'rgba(255,255,255,0.58)', marginBottom: 6 }}>Correct:</div>
                <div style={{ fontSize: 48, fontWeight: 700, color: '#34d399' }}>{correctCount}</div>
              </div>
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 16,
                  backgroundColor: 'rgba(245,158,11,0.10)',
                  border: '1px solid rgba(245,158,11,0.22)',
                }}
              >
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.58)', marginBottom: 6 }}>In top 10</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#fbbf24' }}>{inTop10Count}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr 1fr 64px',
              gap: 16,
              paddingTop: 8,
              paddingBottom: 20,
              borderBottom: '2px solid rgba(255,255,255,0.2)',
              fontSize: 28,
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <div style={{ textAlign: 'center' }}>#</div>
            <div>Result</div>
            <div>Prediction</div>
            <div style={{ textAlign: 'right' }}>Pts</div>
          </div>

          <div>
            {rows.map((row) => {
              const borderColor = getStatusBorderColor(row.status ?? 'wrong')
              return (
                <div
                  key={`${row.position}-${row.driverNumber}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr 1fr 64px',
                    gap: 16,
                    alignItems: 'center',
                    padding: '18px 18px 18px 14px',
                    marginTop: 10,
                    borderRadius: 16,
                    backgroundColor: getStatusRowBackground(row.status),
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `5px solid ${borderColor}`,
                    fontSize: 28,
                  }}
                >
                  <div style={{ textAlign: 'center', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                    {row.position}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {row.actualDriver ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: row.actualDriver.team_colour
                              ? `#${row.actualDriver.team_colour}`
                              : '#94a3b8',
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontWeight: 600 }}>{row.actualDriver.name_acronym}</span>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.4)' }}>#{row.driverNumber}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {row.predictedDriverInfo ? (
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: row.predictedDriverInfo.team_colour
                              ? `#${row.predictedDriverInfo.team_colour}`
                              : '#e2e8f0',
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontWeight: 600,
                            color: getStatusTextColor(row.status),
                          }}
                        >
                          {row.predictedDriverInfo.name_acronym}
                        </span>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                    {row.rowPoints != null ? `${row.rowPoints}pt` : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div
          style={{
            marginTop: 'auto',
            padding: '30px 28px',
            borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Think you can do better?
          </div>
          <div
            style={{
              fontSize: 24,
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: '0.04em',
            }}
          >
            thepredictionpaddock.com
          </div>
        </div>
      </div>
    </div>
  )
}
