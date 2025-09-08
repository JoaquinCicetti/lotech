import { SystemStatus } from '../types'

enum States {
  INICIO = '0_INICIO',
  ASCENSOR = '1_ASCENSOR',
  DOSIFICACION = '2_DOSIFICACION',
  PESAJE = '3_PESAJE',
  TRASPASO = '4_TRASPASO',
  MOLIENDA = '5_MOLIENDA',
  DESCARGA = '6_DESCARGA',
  CIERRE = '7_CIERRE',
  RETIRO = '8_RETIRO',
}
export class SerialMessageParser {
  static parseMessage(line: string, currentStatus: SystemStatus): Partial<SystemStatus> | null {
    // Remove any trailing/leading whitespace
    const cleanLine = line.trim()

    // ESTADO: State change
    if (cleanLine.startsWith('ESTADO:') && cleanLine.includes(':')) {
      const newState = cleanLine.substring(7).trim()
      // Validate state format (should be like "0_INICIO", "1_ASCENSOR", etc.)
      if (/^\d+_[A-Z]+$/.test(newState)) {
        // Validate it's a known state
        const validStates = Object.values(States)
        if (validStates.includes(newState as States)) {
          return { state: newState }
        }
      }
    }

    // PASTILLAS: Pill counter
    if (cleanLine.startsWith('PASTILLAS:')) {
      const match = cleanLine.match(/^PASTILLAS:(\d+)\/(\d+)$/)
      if (match) {
        const count = parseInt(match[1])
        const target = parseInt(match[2])
        // Validate reasonable values
        if (!isNaN(count) && !isNaN(target) && count >= 0 && target > 0) {
          return {
            pillCount: count,
            targetPills: target,
          }
        }
      }
    }

    // PESO: Weight reading
    if (cleanLine.startsWith('PESO:')) {
      const weight = parseFloat(cleanLine.substring(5))
      if (!isNaN(weight)) {
        return { weight }
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
      const parts = cleanLine.split(',')
      if (parts.length >= 2) {
        const state = parts[0].substring(3)
        // Validate state format and it's a known state
        const validStates = [
          '0_INICIO',
          '1_ASCENSOR',
          '2_DOSIFICACION',
          '3_PESAJE',
          '4_TRASPASO',
          '5_MOLIENDA',
          '6_DESCARGA',
          '7_CIERRE',
          '8_RETIRO',
        ]
        if (/^\d+_[A-Z]+$/.test(state) && validStates.includes(state)) {
          return { state }
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

      if (parts[1] === 'FRASCO_VACIO') {
        sensors.frascoVacio = parts[2] === '1'
      } else if (parts[1] === 'PASTILLAS_CARGADAS') {
        sensors.pastillasCargadas = parts[2] === '1'
      }

      return { sensors }
    }

    // SIM: Simulation sensor changes
    if (cleanLine.startsWith('SIM:')) {
      const sensors = { ...currentStatus.sensors }
      const parts = cleanLine.split(':')

      if (parts[1] === 'POS_ALTA') {
        sensors.posAlta = parts[2] === 'ON'
      } else if (parts[1] === 'POS_BAJA') {
        sensors.posBaja = parts[2] === 'ON'
      } else if (parts[1] === 'WEIGHT_STABLE') {
        sensors.weightStable = parts[2] === 'ON'
      } else if (parts[1] === 'FRASCO_VACIO') {
        sensors.frascoVacio = parts[2] === 'ON'
      } else if (parts[1] === 'PASTILLAS_CARGADAS') {
        sensors.pastillasCargadas = parts[2] === 'ON'
      }

      return { sensors }
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
        } else if (key === 'ESTADO') {
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
    // Only check for complete message patterns
    if (line.startsWith('ERROR:')) return 'error'
    if (line.startsWith('ESTADO:')) return 'warning'
    if (line.startsWith('BTN:')) return 'success'
    if (line.startsWith('HB:')) return 'debug'
    if (line.startsWith('ACCION:')) return 'info'
    if (line.startsWith('PESO:') || line.startsWith('PASTILLAS:')) return 'info'
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
