import { SystemStatus } from '../types'

export class SerialMessageParser {
  static parseMessage(line: string, currentStatus: SystemStatus): Partial<SystemStatus> | null {
    // Remove any trailing/leading whitespace
    const cleanLine = line.trim()

    // Spanish message: "Cambio de estado:STATE1->STATE2"
    if (cleanLine.startsWith('Cambio de estado:')) {
      const match = cleanLine.match(/Cambio de estado:.*->(.+)/)
      if (match) {
        const newState = match[1].trim()
        return { state: newState }
      }
    }

    // Progress message: "PROGRESO:STATE,duration"
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

    // Spanish message: "Peso:XX.XX g"
    if (cleanLine.startsWith('Peso:')) {
      const match = cleanLine.match(/Peso:([\d.]+)\s*g/)
      if (match) {
        const weight = parseFloat(match[1])
        return { weight }
      }
    }

    // Spanish message: "Contador de pastillas:X/Y"
    if (cleanLine.startsWith('Contador de pastillas:')) {
      const match = cleanLine.match(/Contador de pastillas:(\d+)\/(\d+)/)
      if (match) {
        return {
          pillCount: parseInt(match[1]),
          targetPills: parseInt(match[2]),
        }
      }
    }

    // Heartbeat message: "HB:STATE,timestamp"
    if (cleanLine.startsWith('HB:')) {
      const parts = cleanLine.split(',')
      const state = parts[0].substring(3)
      return { state }
    }

    // Button messages
    if (cleanLine === 'BTN:START:PRESSED' || cleanLine === 'BTN:RESET:PRESSED') {
      // Just log these, they're confirmations
      return null
    }

    // Simulation sensor messages
    if (cleanLine.startsWith('SIM:')) {
      const sensors = { ...currentStatus.sensors }

      if (cleanLine === 'SIM:POS_ALTA:ON') sensors.posAlta = true
      else if (cleanLine === 'SIM:POS_ALTA:OFF') sensors.posAlta = false
      else if (cleanLine === 'SIM:POS_BAJA:ON') sensors.posBaja = true
      else if (cleanLine === 'SIM:POS_BAJA:OFF') sensors.posBaja = false
      else if (cleanLine === 'SIM:WEIGHT_STABLE:ON') sensors.weightStable = true
      else if (cleanLine === 'SIM:WEIGHT_STABLE:OFF') sensors.weightStable = false
      else if (cleanLine === 'SIM:FRASCO_VACIO:ON') sensors.frascoVacio = true
      else if (cleanLine === 'SIM:FRASCO_VACIO:OFF') sensors.frascoVacio = false
      else if (cleanLine === 'SIM:PASTILLAS_CARGADAS:ON') sensors.pastillasCargadas = true
      else if (cleanLine === 'SIM:PASTILLAS_CARGADAS:OFF') sensors.pastillasCargadas = false

      return { sensors }
    }

    // Delays response: "DELAYS:SETTLE:1500,WEIGHT:2000,..."
    if (cleanLine.startsWith('DELAYS:')) {
      // This is a response message, not a status update
      // It will be handled separately by the settings component
      return null
    }

    // Legacy English message support (STATUS:)
    if (cleanLine.startsWith('STATUS:')) {
      return parseEnglishStatus(cleanLine, currentStatus)
    }

    return null
  }

  static getMessageType(line: string): 'info' | 'warning' | 'error' | 'success' | 'debug' {
    if (line.includes('ERROR')) return 'error'
    if (line.includes('Cambio de estado')) return 'warning'
    if (line.includes('BTN:')) return 'success'
    if (line.includes('HB:')) return 'debug'
    if (line.includes('Peso:') || line.includes('Contador')) return 'info'
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
}

// Keep backward compatibility with English messages
function parseEnglishStatus(line: string, currentStatus: SystemStatus): Partial<SystemStatus> {
  const parts = line.substring(7).split(',')
  const status: Partial<SystemStatus> = {}

  parts.forEach((part) => {
    const [key, value] = part.split(':')
    if (key === 'PILLS') {
      const [count, target] = value.split('/')
      status.pillCount = parseInt(count)
      status.targetPills = parseInt(target)
    } else if (
      key === 'POS_ALTA' ||
      key === 'POS_BAJA' ||
      key === 'WEIGHT' ||
      key === 'FRASCO' ||
      key === 'CARGADAS'
    ) {
      if (!status.sensors) status.sensors = currentStatus.sensors
      switch (key) {
        case 'POS_ALTA':
          status.sensors.posAlta = value === '1'
          break
        case 'POS_BAJA':
          status.sensors.posBaja = value === '1'
          break
        case 'WEIGHT':
          status.sensors.weightStable = value === '1'
          break
        case 'FRASCO':
          status.sensors.frascoVacio = value === '1'
          break
        case 'CARGADAS':
          status.sensors.pastillasCargadas = value === '1'
          break
      }
    }
  })

  return status
}
