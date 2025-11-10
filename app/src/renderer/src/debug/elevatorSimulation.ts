import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'

/**
 * Simple elevator position simulator for debugging
 * Uncomment the startSimulation() call at the bottom to enable
 */

let simulationInterval: NodeJS.Timeout | null = null
let currentProximity = 100 // Start in middle
let direction: 'up' | 'down' = 'up'

export function startElevatorSimulation() {
  if (simulationInterval) {
    console.log('[SIM] Already running')
    return
  }

  console.log('[SIM] Starting elevator simulation')

  simulationInterval = setInterval(() => {
    const { proximity } = useSettingsStore.getState()
    const { updateFromSystemStatus } = useControllerStateStore.getState()

    // Auto-detect sensor orientation: top position is the smaller distance
    const topDistance = Math.min(proximity.minProximity, proximity.maxProximity)
    const bottomDistance = Math.max(proximity.minProximity, proximity.maxProximity)

    // Initialize position to middle if not set
    if (currentProximity < topDistance || currentProximity > bottomDistance) {
      currentProximity = (topDistance + bottomDistance) / 2
    }

    // Move elevator
    const stepSize = 5 // mm per step
    if (direction === 'up') {
      currentProximity -= stepSize // Moving up = closer to sensor = lower distance
      if (currentProximity <= topDistance) {
        currentProximity = topDistance
        direction = 'down'
        console.log('[SIM] Reached TOP at', topDistance, 'mm')
      }
    } else {
      currentProximity += stepSize // Moving down = farther from sensor = higher distance
      if (currentProximity >= bottomDistance) {
        currentProximity = bottomDistance
        direction = 'up'
        console.log('[SIM] Reached BOTTOM at', bottomDistance, 'mm')
      }
    }

    // Update sensor states (trigger within 2mm of limits)
    const isAtTop = currentProximity <= topDistance + 2
    const isAtBottom = currentProximity >= bottomDistance - 2

    updateFromSystemStatus({
      proximityDistance: Math.round(currentProximity),
      sensors: {
        posAlta: isAtTop,
        posBaja: isAtBottom,
        weightStable: false,
        frascoVacio: true,
        pastillasCargadas: true,
      },
    })
  }, 800) // Update every 50ms
}

export function stopElevatorSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
    console.log('[SIM] Stopped elevator simulation')
  }
}

// Uncomment to auto-start simulation:
// startElevatorSimulation()
