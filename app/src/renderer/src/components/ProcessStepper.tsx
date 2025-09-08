import React, { useEffect, useState } from 'react'
import { PROCESS_STATES } from '../constants/states'
import { SystemStatus } from '../types'

interface ProcessStepperProps {
  currentState: string
  pillCount: number
  targetPills: number
  stateProgress?: SystemStatus['stateProgress']
}

export const ProcessStepper: React.FC<ProcessStepperProps> = ({
  currentState,
  pillCount,
  targetPills,
  stateProgress,
}) => {
  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    if (!stateProgress) {
      setProgressPercent(0)
      return
    }

    const updateProgress = (): void => {
      const elapsed = Date.now() - stateProgress.startTime
      const percent = Math.min((elapsed / stateProgress.expectedDuration) * 100, 100)
      setProgressPercent(percent)
    }

    updateProgress()
    const interval = setInterval(updateProgress, 100)
    return () => clearInterval(interval)
  }, [stateProgress])

  const getCurrentStateIndex = (): number => {
    return PROCESS_STATES.findIndex((s) => s.id === currentState)
  }

  const currentIndex = getCurrentStateIndex()
  const progressPercentage = (currentIndex / (PROCESS_STATES.length - 1)) * 100

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: 16,
        padding: 32,
        marginBottom: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          marginBottom: 40,
        }}
      >
        {/* Progress Line Background */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 40,
            right: 40,
            height: 2,
            background: '#2d3748',
            zIndex: 0,
          }}
        />

        {/* Progress Line Active */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 40,
            width: `${progressPercentage * 0.92}%`,
            height: 2,
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            zIndex: 0,
            transition: 'width 0.5s ease',
          }}
        />

        {/* State Steps */}
        {PROCESS_STATES.map((state, index) => {
          const isActive = state.id === currentState
          const isPast = index < currentIndex

          return (
            <div
              key={state.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                zIndex: 1,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 48,
                  height: 48,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: isActive
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : isPast
                        ? '#667eea'
                        : '#2d3748',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: isActive ? '0 0 20px rgba(102, 126, 234, 0.5)' : 'none',
                    color: 'white',
                  }}
                >
                  {state.icon}
                </div>
                {isActive && stateProgress && (
                  <svg
                    style={{
                      position: 'absolute',
                      top: -6,
                      left: -6,
                      width: 60,
                      height: 60,
                      transform: 'rotate(-90deg)',
                    }}
                  >
                    <circle cx="30" cy="30" r="27" fill="none" stroke="#2d3748" strokeWidth="2" />
                    <circle
                      cx="30"
                      cy="30"
                      r="27"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 27}`}
                      strokeDashoffset={`${2 * Math.PI * 27 * (1 - progressPercent / 100)}`}
                      style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                    />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: isActive ? '#e2e8f0' : '#718096',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {state.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pill Counter */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px 0',
        }}
      >
        <div style={{ fontSize: 14, color: '#718096', marginBottom: 8 }}>Progreso del lote</div>
        <div style={{ fontSize: 48, fontWeight: 200 }}>
          {pillCount} <span style={{ color: '#718096' }}>/ {targetPills}</span>
        </div>
        <div
          style={{
            width: '100%',
            height: 4,
            background: '#2d3748',
            borderRadius: 2,
            marginTop: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(pillCount / targetPills) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
