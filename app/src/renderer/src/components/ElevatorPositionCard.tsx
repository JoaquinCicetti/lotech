import { Card, CardContent } from '@renderer/components/ui/card'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { ArrowDown, ArrowUp, ArrowsUpFromLine } from 'lucide-react'
import React, { useMemo } from 'react'

export const ElevatorPositionCard: React.FC = () => {
  const { proximityDistance, posAlta, posBaja } = useControllerStateStore(
    (state) => state.sensorReadings
  )
  const { hardwareStatus } = useControllerStateStore()
  const proximity = useSettingsStore((state) => state.proximity)

  // Calculate elevator position percentage
  const elevatorPosition = useMemo(() => {
    if (proximityDistance > 0 && proximity.minProximity > 0 && proximity.maxProximity > 0) {
      const maxDist = proximity.minProximity
      const minDist = proximity.maxProximity
      const currentDist = proximityDistance

      // Clamp distance within bounds
      const clampedDist = Math.max(minDist, Math.min(maxDist, currentDist))

      // Calculate position (0% = bottom, 100% = top)
      const position = ((maxDist - clampedDist) / (maxDist - minDist)) * 100
      return Math.round(position)
    }
    return 0
  }, [proximityDistance, proximity.minProximity, proximity.maxProximity])

  // Determine movement direction
  const isMovingUp = hardwareStatus.elevator === 'MOVING_UP'
  const isMovingDown = hardwareStatus.elevator === 'MOVING_DOWN'

  return (
    <Card className="bg-background/80 shadow-lg backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/20 p-2">
              <ArrowsUpFromLine className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Posición Elevador</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold tabular-nums">{proximityDistance}mm</p>
                {isMovingUp && (
                  <span className="ml-2 flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-600">
                    <ArrowUp className="h-3 w-3" />
                    Subiendo
                  </span>
                )}
                {isMovingDown && (
                  <span className="ml-2 flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-600">
                    <ArrowDown className="h-3 w-3" />
                    Bajando
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {posAlta && (
                  <span className="rounded-full bg-lime-500/20 px-2 py-0.5 text-xs text-lime-600">
                    Arriba
                  </span>
                )}
                {posBaja && (
                  <span className="rounded-full bg-lime-500/20 px-2 py-0.5 text-xs text-lime-600">
                    Abajo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vertical Elevator Position Indicator */}
          <div className="flex flex-col items-center">
            <div className="bg-border/30 relative h-20 w-1 rounded-full">
              {/* Top sensor indicator */}
              <div
                className={`absolute top-0 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full transition-colors ${
                  posAlta ? 'bg-lime-500' : 'bg-transparent'
                }`}
              />

              {/* Bottom sensor indicator */}
              <div
                className={`absolute bottom-0 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full transition-colors ${
                  posBaja ? 'bg-lime-500' : 'bg-transparent'
                }`}
              />

              {/* Current position marker - small horizontal green bar */}
              <div
                className="absolute left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-lime-500 shadow-lg transition-all duration-300"
                style={{ bottom: `${elevatorPosition}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
