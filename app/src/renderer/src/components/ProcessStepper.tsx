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
    <Card className="bg-card mb-8 p-8">
      <div className="relative mb-10 flex justify-between">
        {/* Progress Line Background */}
        <div className="bg-muted absolute top-6 right-10 left-10 z-0 h-0.5" />

        {/* Progress Line Active */}
        <div
          className="from-primary to-primary/80 absolute top-6 left-10 z-0 h-0.5 bg-gradient-to-r transition-all duration-500"
          style={{
            width: `${progressPercentage * 0.92}%`,
          }}
        />

        {/* State Steps */}
        {PROCESS_STATES.map((state, index) => {
          const isActive = state.id === currentState
          const isPast = index < currentIndex

          return (
            <div key={state.id} className="z-10 flex flex-col items-center gap-2 px-4">
              <div className="relative h-12 w-12">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'from-primary to-primary/80 shadow-primary/30 scale-125 bg-gradient-to-br text-black shadow-lg'
                      : isPast
                        ? 'bg-primary text-black'
                        : 'bg-muted text-white'
                  } `}
                >
                  {state.icon}
                </div>
                {isActive && stateProgress && (
                  <svg
                    className="absolute -top-1.5 -left-1.5 h-15 w-15 -rotate-90"
                    style={{
                      width: 60,
                      height: 60,
                    }}
                  >
                    <circle
                      cx="30"
                      cy="30"
                      r="27"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="2"
                    />
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
                className={`text-xs ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-normal'} `}
              >
                {state.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pill Counter */}
      <div className="py-5 text-center">
        <div className="text-muted-foreground mb-2 text-sm">Progreso del lote</div>
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
