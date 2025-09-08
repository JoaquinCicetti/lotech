import React, { useEffect, useState } from 'react'
import { PROCESS_STATES } from '../constants/states'
import { SystemStatus } from '../types'
import { Card } from './ui/card'
import { Progress } from './ui/progress'

interface ProcessStepperProps {
  currentState: string
  pillCount: number
  targetPills: number
  stateProgress?: SystemStatus['stateProgress']
}

export const ProcessStepper: React.FC<ProcessStepperProps> = (props) => {
  const { currentState, pillCount, targetPills, stateProgress } = props
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
    <Card className="p-8 mb-8 bg-card">
      <div className="flex justify-between relative mb-10">
        {/* Progress Line Background */}
        <div className="absolute top-6 left-10 right-10 h-0.5 bg-muted z-0" />

        {/* Progress Line Active */}
        <div
          className="absolute top-6 left-10 h-0.5 bg-gradient-to-r from-primary to-primary/80 z-0 transition-all duration-500"
          style={{
            width: `${progressPercentage * 0.92}%`,
          }}
        />

        {/* State Steps */}
        {PROCESS_STATES.map((state, index) => {
          const isActive = state.id === currentState
          const isPast = index < currentIndex

          return (
            <div
              key={state.id}
              className="flex flex-col items-center gap-2 z-10"
            >
              <div className="relative w-12 h-12">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    transition-all duration-300 text-white
                    ${isActive 
                      ? 'bg-gradient-to-br from-primary to-primary/80 scale-125 shadow-lg shadow-primary/30' 
                      : isPast 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }
                  `}
                >
                  {state.icon}
                </div>
                {isActive && stateProgress && (
                  <svg
                    className="absolute -top-1.5 -left-1.5 w-15 h-15 -rotate-90"
                    style={{
                      width: 60,
                      height: 60,
                    }}
                  >
                    <circle cx="30" cy="30" r="27" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" />
                    <circle
                      cx="30"
                      cy="30"
                      r="27"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 27}`}
                      strokeDashoffset={`${2 * Math.PI * 27 * (1 - progressPercent / 100)}`}
                      className="transition-all duration-100"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`
                  text-xs
                  ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-normal'}
                `}
              >
                {state.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pill Counter */}
      <div className="text-center py-5">
        <div className="text-sm text-muted-foreground mb-2">Progreso del lote</div>
        <div className="text-5xl font-light">
          {pillCount} <span className="text-muted-foreground">/ {targetPills}</span>
        </div>
        <div className="mt-4">
          <Progress value={(pillCount / targetPills) * 100} className="h-1" />
        </div>
      </div>
    </Card>
  )
}