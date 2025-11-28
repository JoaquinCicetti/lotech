import {
  CapStatus,
  DosingStatus,
  ElevatorStatus,
  GrinderStatus,
  TransferStatus,
} from '@renderer/serial/commands'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'

/**
 * Enhanced machine simulator for debugging
 * Simulates elevator, dosing wheel, and grinder animations
 * Uncomment the startSimulation() call at the bottom to enable
 */

let simulationInterval: NodeJS.Timeout | null = null
let currentProximity = 100 // Start in middle
let direction: 'up' | 'down' = 'up'
let dosingState: 'idle' | 'active' | 'forward' | 'pause' = 'idle'
let grinderOn = false
let currentWeight = 0
let cycleCounter = 0

export function startSimulation() {
  if (simulationInterval) {
    console.log('[SIM] Already running')
    return
  }

  console.log('[SIM] Starting full machine simulation (elevator + wheel + mixer)')

  simulationInterval = setInterval(() => {
    const { proximity } = useSettingsStore.getState()
    const { updateFromSystemStatus } = useControllerStateStore.getState()
    cycleCounter++

    // Auto-detect sensor orientation: top position is the smaller distance
    const topDistance = Math.min(proximity.minProximity, proximity.maxProximity)
    const bottomDistance = Math.max(proximity.minProximity, proximity.maxProximity)

    // Initialize position to middle if not set
    if (currentProximity < topDistance || currentProximity > bottomDistance) {
      currentProximity = (topDistance + bottomDistance) / 2
    }

    // ========== ELEVATOR ANIMATION ==========
    const stepSize = 5 // mm per step
    if (direction === 'up') {
      currentProximity -= stepSize // Moving up = closer to sensor = lower distance
      if (currentProximity <= topDistance) {
        currentProximity = topDistance
        direction = 'down'
        console.log('[SIM] Elevator reached TOP at', topDistance, 'mm')
      }
    } else {
      currentProximity += stepSize // Moving down = farther from sensor = higher distance
      if (currentProximity >= bottomDistance) {
        currentProximity = bottomDistance
        direction = 'up'
        console.log('[SIM] Elevator reached BOTTOM at', bottomDistance, 'mm')
      }
    }

    // Update sensor states (trigger within 2mm of limits)
    const isAtTop = currentProximity <= topDistance + 2
    const isAtBottom = currentProximity >= bottomDistance - 2

    // ========== DOSING WHEEL ANIMATION ==========
    // Cycle through states: idle (3s) -> active (1s) -> forward (2s) -> pause (1s) -> repeat
    let dosingStatusEnum: DosingStatus
    const cyclePhase = cycleCounter % 9 // 9 cycles = ~7 seconds at 800ms intervals

    if (cyclePhase < 4) {
      // Idle phase
      dosingState = 'idle'
      dosingStatusEnum = DosingStatus.IDLE
    } else if (cyclePhase < 5) {
      // Active phase
      if (dosingState !== 'active') {
        console.log('[SIM] Dosing wheel: ACTIVE')
        dosingState = 'active'
      }
      dosingStatusEnum = DosingStatus.ACTIVE
    } else if (cyclePhase < 7) {
      // Forward rotation phase
      if (dosingState !== 'forward') {
        console.log('[SIM] Dosing wheel: ROTATING FORWARD')
        dosingState = 'forward'
        // Simulate weight increase when dosing
        currentWeight += 50 // Add 50g per dosing cycle
      }
      dosingStatusEnum = DosingStatus.FWD
    } else {
      // Pause phase
      dosingState = 'pause'
      dosingStatusEnum = DosingStatus.STOPPED
    }

    // ========== GRINDER ANIMATION ==========
    // Toggle grinder every 5 seconds (6 cycles)
    if (cycleCounter % 6 === 0) {
      grinderOn = !grinderOn
      console.log('[SIM] Grinder:', grinderOn ? 'ON' : 'OFF')
    }

    // ========== WEIGHT SIMULATION ==========
    // Reset weight when elevator reaches bottom (bottle removed)
    if (isAtBottom && currentWeight > 0) {
      console.log('[SIM] Weight reset (bottle removed at bottom)')
      currentWeight = 0
    }

    // Add some realistic weight variation
    const weightVariation = Math.random() * 2 - 1 // ±1g
    const simulatedWeight = Math.max(0, currentWeight + weightVariation)

    // ========== UPDATE STATE ==========
    updateFromSystemStatus({
      proximityDistance: Math.round(currentProximity),
      weight: Math.round(simulatedWeight),
      sensors: {
        posAlta: isAtTop,
        posBaja: isAtBottom,
        weightStable: Math.abs(weightVariation) < 0.5,
        frascoVacio: currentWeight < 5,
        pastillasCargadas: true,
      },
      hardware: {
        elevator: direction === 'up' ? ElevatorStatus.MOVING_UP : ElevatorStatus.MOVING_DOWN,
        dosing: dosingStatusEnum,
        grinder: grinderOn ? GrinderStatus.ON : GrinderStatus.OFF,
        transfer: TransferStatus.CLOSED,
        cap: CapStatus.RETRACTED,
        weight: Math.round(simulatedWeight),
      },
    })
  }, 800) // Update every 800ms
}

export function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
    console.log('[SIM] Stopped full machine simulation')

    // Reset simulation state
    currentProximity = 100
    direction = 'up'
    dosingState = 'idle'
    grinderOn = false
    currentWeight = 0
    cycleCounter = 0
  }
}

// Uncomment to auto-start simulation:
// startSimulation()
