import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { usePillTrackingStore } from '@renderer/store/pillTrackingStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useEffect, useState } from 'react'
import { PROCESS_STATES } from '../constants/states'
import { Progress } from './ui/progress'

export const ProcessStepper: React.FC = () => {
  const { machineState, pillCount, stateProgress } = useControllerStateStore()
  const { dosing } = useSettingsStore()
  const { currentCycle, isTracking } = usePillTrackingStore()

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
    return PROCESS_STATES.findIndex((s) => s.id === machineState)
  }

  const currentIndex = getCurrentStateIndex()
  const progressPercentage = (currentIndex / (PROCESS_STATES.length - 1)) * 100

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4 p-8">
      <div className="relative flex justify-between">
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
          const isActive = state.id === machineState
          const isPast = index < currentIndex

          return (
            <div key={state.id} className="z-10 flex flex-col items-center gap-2 px-2">
              <div className="relative h-12 w-12">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'from-primary to-primary/80 shadow-primary/30 text-primary-foreground scale-125 bg-gradient-to-br shadow-lg'
                      : isPast
                        ? 'bg-primary/60 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
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

      {/* Compact Cycle Info */}
      <div className="space-y-2 py-3">
        {/* Single Row: Lot info + Duration */}
        {isTracking && currentCycle && (
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Lote:</span>
              <span className="text-primary font-semibold">{currentCycle.lotNumber}</span>
            </div>
            <div className="bg-border h-4 w-px" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Duración:</span>
              <span className="font-mono font-semibold">
                {formatDuration(currentCycle.startTime)}
              </span>
            </div>
          </div>
        )}

        {/* Compact Pill Counter with Progress */}
        <div className="space-y-2 text-center">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl font-light">{pillCount}</span>
            <span className="text-muted-foreground text-lg">/ {dosing.lotSize}</span>
          </div>
          <Progress value={(pillCount / dosing.lotSize) * 100} className="h-1" />
        </div>
      </div>
    </div>
  )
}
