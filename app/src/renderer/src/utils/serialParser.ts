import { isValidMachineState } from '@renderer/constants/states'
import { SystemStatus } from '../types'

export class SerialMessageParser {
  static parseMessage(line: string, currentStatus: SystemStatus): Partial<SystemStatus> | null {
    // Remove any trailing/leading whitespace and control characters
    // eslint-disable-next-line no-control-regex
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

    // PASTILLAS: Pill counter (current/lotSize)
    if (cleanLine.startsWith('PASTILLAS:')) {
      const match = cleanLine.match(/^PASTILLAS:(\d+)\/(\d+)/)
      if (match) {
        const count = parseInt(match[1])
        const lotSize = parseInt(match[2])
        // Validate reasonable values
        if (!isNaN(count) && !isNaN(lotSize) && count >= 0 && lotSize > 0 && lotSize <= 1000) {
          // Note: lotSize is stored in dosing settings, not system status
          // We only track the current pill count in status
          return {
            pillCount: count,
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

    // SET: Configuration confirmations (to avoid UNKNOWN messages)
    if (cleanLine.startsWith('SET:')) {
      // These are confirmations from the device, already handled in parseDelays/parseDosing
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
          const [count] = value.split('/')
          status.pillCount = parseInt(count)
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

    // TEST: Test mode hardware status updates
    if (cleanLine.startsWith('TEST:')) {
      const parts = cleanLine.split(':')
      
      if (parts.length >= 3) {
        const hardware = currentStatus.hardware || {
          elevator: 'IDLE',
          dosing: 'IDLE',
          grinder: 'OFF',
          transfer: 'CLOSED',
          cap: 'RETRACTED',
          weight: 0
        }
        
        const component = parts[1]
        const status = parts[2]
        
        if (component === 'ELEVATOR') {
          if (status === 'MOVING_UP') {
            hardware.elevator = 'MOVING_UP' as any
          } else if (status === 'MOVING_DOWN') {
            hardware.elevator = 'MOVING_DOWN' as any
          } else {
            hardware.elevator = status as 'UP' | 'DOWN' | 'MOVING' | 'MIDDLE' | 'IDLE'
          }
        } else if (component === 'DOSING') {
          if (status === 'STEP') {
            hardware.dosing = 'ACTIVE'
          } else if (status === 'COMPLETE' || status === 'STOP') {
            hardware.dosing = 'IDLE'
          }
        } else if (component === 'GRINDER') {
          hardware.grinder = status as 'ON' | 'OFF'
        } else if (component === 'TRANSFER') {
          hardware.transfer = status === 'ON' ? 'OPEN' : 'CLOSED'
        } else if (component === 'CAP') {
          hardware.cap = status === 'ON' ? 'PUSHED' : 'RETRACTED'
        } else if (component === 'WEIGHT' && parts.length >= 3) {
          hardware.weight = parseFloat(status) || 0
        }
        
        return { hardware }
      }
    }
    
    // TEST_MODE: Test mode enable/disable
    if (cleanLine.startsWith('TEST_MODE:')) {
      const enabled = cleanLine.includes('ENABLED')
      // Store test mode state if needed
      return null
    }

    // ELEVADOR: Elevator position messages (for non-test mode)
    if (cleanLine.startsWith('ELEVADOR:')) {
      const position = cleanLine.substring(9).trim()
      const hardware = currentStatus.hardware || {
        elevator: 'IDLE',
        dosing: 'IDLE',
        grinder: 'OFF',
        transfer: 'CLOSED',
        cap: 'RETRACTED',
        weight: 0
      }
      
      if (position === 'ARRIBA') {
        hardware.elevator = 'UP'
      } else if (position === 'ABAJO') {
        hardware.elevator = 'DOWN'
      }
      
      return { hardware }
    }

    // MODO: Mode changes
    if (cleanLine.startsWith('MODO:')) {
      // Just log information, no state change needed
      return null
    }

    // ESCALA: Scale messages
    if (cleanLine.startsWith('ESCALA:')) {
      // Just log information, no state change needed
      return null
    }

    // ACCION: Action messages
    if (cleanLine.startsWith('ACCION:')) {
      // Just log information, no state change needed
      return null
    }

    // SISTEMA: System messages
    if (cleanLine.startsWith('SISTEMA:')) {
      // Just log information, no state change needed
      return null
    }

    return null
  }

  static getMessageType(line: string): 'info' | 'warning' | 'error' | 'success' | 'debug' {
    const cleanLine = line.trim()
    // Only check for complete message patterns
    if (cleanLine.startsWith('ERROR:')) return 'error'
    if (cleanLine.startsWith('UNKNOWN:')) return 'error'
    if (cleanLine.startsWith('ESTADO:')) return 'warning'
    if (cleanLine.startsWith('BTN:')) return 'success'
    if (cleanLine.startsWith('SET:')) return 'success'
    if (cleanLine.startsWith('HB:')) return 'debug'
    if (cleanLine.startsWith('ACCION:')) return 'info'
    if (cleanLine.startsWith('MODO:')) return 'info'
    if (cleanLine.startsWith('ESCALA:')) return 'info'
    if (cleanLine.startsWith('ELEVADOR:')) return 'info'
    if (cleanLine.startsWith('PESO:') || cleanLine.startsWith('PASTILLAS:')) return 'info'
    if (cleanLine.startsWith('SIM:') || cleanLine.startsWith('SENSORES:')) return 'debug'
    if (cleanLine.startsWith('DELAYS:') || cleanLine.startsWith('DOSING:')) return 'success'
    if (cleanLine.startsWith('SISTEMA:')) return 'warning'
    return 'info'
  }

  static parseDelays(line: string): Record<string, number> | null {
    // Handle full DELAYS response from GET:DELAYS
    if (line.startsWith('DELAYS:')) {
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

    // Handle individual SET:DELAY confirmations
    if (line.startsWith('SET:DELAY:')) {
      const match = line.match(/^SET:DELAY:([A-Z]+):(\d+)$/)
      if (match) {
        const key = match[1].toLowerCase()
        const value = parseInt(match[2])
        // Map controller keys to app keys
        const keyMap: Record<string, string> = {
          settle: 'settle',
          weight: 'weight',
          transfer: 'transfer',
          grind: 'grind',
          cap: 'cap',
          up: 'elevUp',
          down: 'elevDown',
        }
        const mappedKey = keyMap[key] || key
        return { [mappedKey]: value }
      }
    }

    return null
  }

  static parseDosing(line: string): Record<string, number> | null {
    // Handle full DOSING response from GET:DOSING
    if (line.startsWith('DOSING:')) {
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

    // Handle individual SET confirmations
    if (line.startsWith('SET:DIVISIONS:')) {
      const value = parseInt(line.substring(14))
      if (!isNaN(value)) {
        return { divisions: value }
      }
    }

    if (line.startsWith('SET:LOT_SIZE:')) {
      const value = parseInt(line.substring(13))
      if (!isNaN(value)) {
        return { lot_size: value }
      }
    }

    return null
  }
}
