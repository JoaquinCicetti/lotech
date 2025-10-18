import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { ArrowDown, ArrowUp } from 'lucide-react'
import React from 'react'

export const ElevatorIndicator: React.FC = () => {
  const { sensorReadings, hardwareStatus } = useControllerStateStore()
  const { proximity } = useSettingsStore()

  // Calculate elevator position (0 = bottom, 100 = top)
  // VL53L0X sensor mounted at TOP:
  // - Small distance (≤minProximity) = elevator at TOP (100%)
  // - Large distance (≥maxProximity) = elevator at BOTTOM (0%)

  // Get the actual configured thresholds
  const minDist = proximity.minProximity // Top position threshold (~100mm)
  const maxDist = proximity.maxProximity // Bottom position threshold (~300mm)
  const currentDist = sensorReadings.proximityDistance

  // Calculate position with precise mapping
  // minDist (top) = 100%, maxDist (bottom) = 0%
  // Clamp to ensure smooth animation between min and max
  let elevatorPosition = 0
  if (currentDist <= minDist) {
    elevatorPosition = 100 // At or above top
  } else if (currentDist >= maxDist) {
    elevatorPosition = 0 // At or below bottom
  } else {
    // Linear interpolation between min and max
    // (maxDist - currentDist) / (maxDist - minDist) gives us a value between 0 and 1
    // Multiply by 100 to get percentage
    elevatorPosition = ((maxDist - currentDist) / (maxDist - minDist)) * 100
  }

  // Debug: log position mapping
  React.useEffect(() => {
    const debugInfo = `dist=${currentDist}mm (min=${minDist}, max=${maxDist}) => pos=${elevatorPosition.toFixed(1)}%`

    console.log('Elevator position mapping:', debugInfo)
  }, [currentDist, minDist, maxDist, elevatorPosition])

  // Determine if elevator is at positions
  const isAtTop = sensorReadings.posAlta
  const isAtBottom = sensorReadings.posBaja
  const isMovingUp = hardwareStatus.elevator === 'MOVING_UP'
  const isMovingDown = hardwareStatus.elevator === 'MOVING_DOWN'
  const isMoving = isMovingUp || isMovingDown

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-2">
      {/* Top Position Indicator */}
      <div className="flex items-center space-x-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            isAtTop ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <span className="text-muted-foreground text-xs">Arriba</span>
      </div>

      {/* Elevator Shaft */}
      <div className="relative h-32 w-12 rounded border-2 border-gray-300 bg-gray-50 dark:bg-gray-900">
        {/* Elevator Car */}
        <div
          className={cn(
            'absolute right-0 left-0 mx-auto h-6 w-10 rounded transition-all duration-500',
            isMoving ? 'bg-orange-500' : 'bg-blue-500',
            isMoving && 'animate-pulse'
          )}
          style={{
            bottom: `${elevatorPosition}%`,
            transform: 'translateY(50%)',
          }}
        >
          {/* Direction Arrow */}
          {isMovingUp && (
            <ArrowUp className="absolute -top-3 left-1/2 h-3 w-3 -translate-x-1/2 text-orange-500" />
          )}
          {isMovingDown && (
            <ArrowDown className="absolute -bottom-3 left-1/2 h-3 w-3 -translate-x-1/2 text-orange-500" />
          )}
        </div>

        {/* Position markers */}
        <div className="absolute right-0 bottom-0 left-0 h-px bg-gray-400" />
        <div className="absolute top-0 right-0 left-0 h-px bg-gray-400" />
      </div>

      {/* Bottom Position Indicator */}
      <div className="flex items-center space-x-2">
        <div
          className={cn(
            'h-2 w-2 rounded-full transition-colors',
            isAtBottom ? 'bg-green-500' : 'bg-gray-300'
          )}
        />
        <span className="text-muted-foreground text-xs">Abajo</span>
      </div>

      {/* Proximity Value */}
      <div className="text-center">
        <p className="text-muted-foreground text-[10px]">
          Distancia: {sensorReadings.proximityDistance} mm
        </p>
      </div>
    </div>
  )
}
