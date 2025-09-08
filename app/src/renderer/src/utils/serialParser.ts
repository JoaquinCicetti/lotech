import { isValidMachineState } from '@renderer/constants/states'
import { SystemStatus } from '../types'

export class SerialMessageParser {
  static parseMessage(line: string, currentStatus: SystemStatus): Partial<SystemStatus> | null {
    // Remove any trailing/leading whitespace and control characters
    const cleanLine = line.trim().replace(/[\r\x00-\x1F\x7F]/g, '')

    // Skip empty or too short messages
    if (cleanLine.length < 3) {
      return null
    }

    // ESTADO: State change
    if (cleanLine.startsWith('ESTADO:')) {
      const newState = cleanLine.substring(7).trim()

      if (newState && isValidMachineState(newState)) {
        console.log(`State change: ${newState}`)
        return { state: newState }
      } else {
        console.warn(`Invalid state received: ${newState}`)
      }
    }

    // PASTILLAS: Pill counter
    if (cleanLine.startsWith('PASTILLAS:')) {
      const match = cleanLine.match(/^PASTILLAS:(\d+)\/(\d+)/)
      if (match) {
        const count = parseInt(match[1])
        const target = parseInt(match[2])
        // Validate reasonable values
        if (!isNaN(count) && !isNaN(target) && count >= 0 && target > 0 && target <= 1000) {
          return {
            pillCount: count,
            targetPills: target,
          }
        } else {
          console.warn(`Invalid pill count: ${cleanLine}`)
        }
      }
    }

    // PESO: Weight reading
    if (cleanLine.startsWith('PESO:')) {
      const weightStr = cleanLine.substring(5).trim()
      const weight = parseFloat(weightStr)
      if (!isNaN(weight) && weight >= -100 && weight <= 10000) {
        return { weight }
      } else {
        console.warn(`Invalid weight reading: ${weightStr}`)
      }
    }

    // ELEVADOR: Elevator position
    if (cleanLine.startsWith('ELEVADOR:')) {
      const position = cleanLine.substring(9).trim()
      const sensors = { ...currentStatus.sensors }
      if (position === 'ARRIBA') {
        sensors.posAlta = true
        sensors.posBaja = false
      } else if (position === 'ABAJO') {
        sensors.posAlta = false
        sensors.posBaja = true
      }
      return { sensors }
    }

    // PROGRESO: Progress indicator
    if (cleanLine.startsWith('PROGRESO:')) {
      const match = cleanLine.match(/PROGRESO:([^,]+),(\d+)/)
      if (match) {
        return {
          stateProgress: {
            state: match[1],
            expectedDuration: parseInt(match[2]),
            startTime: Date.now(),
          },
        }
      }
    }

    // HB: Simple heartbeat
    if (cleanLine.startsWith('HB:')) {
      const parts = cleanLine.substring(3).split(',')
      if (parts.length >= 1) {
        const state = parts[0].trim()

        if (state && isValidMachineState(state)) {
          // Only update state from heartbeat if we haven't received a state update recently
          return { state, lastHeartbeat: Date.now() }
        }
      }
    }

    // BTN: Button confirmations
    if (cleanLine.startsWith('BTN:')) {
      // These are just confirmations, no state change needed
      return null
    }

    // SENSORES: Sensor updates (both real and simulation modes)
    if (cleanLine.startsWith('SENSORES:')) {
      const sensors = { ...currentStatus.sensors }
      const parts = cleanLine.split(':')

      if (parts.length >= 3) {
        if (parts[1] === 'FRASCO_VACIO') {
          sensors.frascoVacio = parts[2] === '1'
        } else if (parts[1] === 'PASTILLAS_CARGADAS') {
          sensors.pastillasCargadas = parts[2] === '1'
        }
        return { sensors }
      }
    }

    // SIM: Simulation sensor changes
    if (cleanLine.startsWith('SIM:')) {
      const sensors = { ...currentStatus.sensors }
      const parts = cleanLine.split(':')

      if (parts.length >= 3) {
        const sensorName = parts[1]
        const value = parts[2]

        if (sensorName === 'POS_ALTA') {
          sensors.posAlta = value === 'ON'
        } else if (sensorName === 'POS_BAJA') {
          sensors.posBaja = value === 'ON'
        } else if (sensorName === 'WEIGHT_STABLE') {
          sensors.weightStable = value === 'ON'
        } else if (sensorName === 'FRASCO_VACIO') {
          sensors.frascoVacio = value === 'ON'
        } else if (sensorName === 'PASTILLAS_CARGADAS') {
          sensors.pastillasCargadas = value === 'ON'
        }
        return { sensors }
      }
    }

    // DELAYS: Configuration response
    if (cleanLine.startsWith('DELAYS:')) {
      // Handled separately by parseDelays
      return null
    }

    // STATUS: Full status response
    if (cleanLine.startsWith('STATUS:')) {
      const parts = cleanLine.substring(7).split(',')
      const status: Partial<SystemStatus> = {}
      const sensors = { ...currentStatus.sensors }

      parts.forEach((part) => {
        const [key, value] = part.split(':')
        if (key === 'PASTILLAS') {
          const [count, target] = value.split('/')
          status.pillCount = parseInt(count)
          status.targetPills = parseInt(target)
        } else if (key === 'PESO') {
          status.weight = parseFloat(value)
        } else if (key === 'ESTADO' && isValidMachineState(value)) {
          status.state = value
        } else if (key === 'FRASCO_VACIO') {
          sensors.frascoVacio = value === '1'
        } else if (key === 'PASTILLAS_CARGADAS') {
          sensors.pastillasCargadas = value === '1'
        }
      })

      if (Object.keys(sensors).length > 0) {
        status.sensors = sensors
      }

      return status
    }

    return null
  }

  static getMessageType(line: string): 'info' | 'warning' | 'error' | 'success' | 'debug' {
    const cleanLine = line.trim()
    // Only check for complete message patterns
    if (cleanLine.startsWith('ERROR:')) return 'error'
    if (cleanLine.startsWith('ESTADO:')) return 'warning'
    if (cleanLine.startsWith('BTN:')) return 'success'
    if (cleanLine.startsWith('HB:')) return 'debug'
    if (cleanLine.startsWith('ACCION:')) return 'info'
    if (cleanLine.startsWith('PESO:') || cleanLine.startsWith('PASTILLAS:')) return 'info'
    if (cleanLine.startsWith('SIM:') || cleanLine.startsWith('SENSORES:')) return 'debug'
    return 'info'
  }

  static parseDelays(line: string): Record<string, number> | null {
    if (!line.startsWith('DELAYS:')) return null

    const result: Record<string, number> = {}
    const parts = line.substring(7).split(',')

    parts.forEach((part) => {
      const [key, value] = part.split(':')
      if (key && value) {
        result[key.toLowerCase()] = parseInt(value)
      }
    })

    return result
  }

  static parseDosing(line: string): Record<string, number> | null {
    if (!line.startsWith('DOSING:')) return null

    const result: Record<string, number> = {}
    const parts = line.substring(7).split(',')

    parts.forEach((part) => {
      const [key, value] = part.split(':')
      if (key && value) {
        result[key.toLowerCase()] = parseInt(value)
      }
    })

    return result
  }
}
