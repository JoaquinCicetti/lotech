import { isValidMachineState } from '@renderer/constants/states'
import { toast } from 'sonner'
import { SystemStatus } from '../types'
import {
  CapStatus,
  CommandPrefix,
  DelayKeyMap,
  DosingStatus,
  ElevatorStatus,
  getMessageType,
  GrinderStatus,
  isValidProximityStatus,
  RestrictionStatus,
  SensorName,
  TransferStatus,
} from './commands'

export class SerialMessageParser {
  static parseMessage(line: string, currentStatus: SystemStatus): Partial<SystemStatus> | null {
    // Remove any trailing/leading whitespace and control characters
    // eslint-disable-next-line no-control-regex
    const cleanLine = line.trim().replace(/[\r\x00-\x1F\x7F]/g, '')

    // Skip empty or too short messages
    if (cleanLine.length < 3) {
      return null
    }

    // STATE: Machine state changes
    if (cleanLine.startsWith(CommandPrefix.STATE)) {
      const newState = cleanLine.substring(CommandPrefix.STATE.length).trim()
      if (newState && isValidMachineState(newState)) {
        return { state: newState }
      }
    }

    // PILLS: Pill counter
    if (cleanLine.startsWith(CommandPrefix.PILLS)) {
      console.log('PILLS message detected:', cleanLine)
      const match = cleanLine.match(/^PILLS:(\d+)\/(\d+)/)
      console.log('Regex match result:', match)
      if (match) {
        const count = parseInt(match[1])
        const lotSize = parseInt(match[2])
        console.log('Parsed pill count:', count, 'lot size:', lotSize)
        if (!isNaN(count) && !isNaN(lotSize) && count >= 0 && lotSize > 0) {
          console.log('Returning pillCount:', count)
          return { pillCount: count }
        }
      }
    }

    // WEIGHT: Weight reading (can be RAW, mg or g)
    if (cleanLine.startsWith(CommandPrefix.WEIGHT)) {
      let weightStr = cleanLine.substring(CommandPrefix.WEIGHT.length).trim()

      // Check format
      let weight = 0
      if (weightStr.startsWith('RAW:')) {
        // Raw value from load cell - just display as is for debugging
        const rawValue = parseFloat(weightStr.replace('RAW:', ''))
        // For now, just show raw value divided by 1000 to keep it readable
        weight = rawValue / 1000
      } else if (weightStr.endsWith(' mg')) {
        // Weight in milligrams - convert to grams for display
        weight = parseFloat(weightStr.replace(' mg', '')) / 1000
      } else if (weightStr.endsWith(' g')) {
        // Weight in grams
        weight = parseFloat(weightStr.replace(' g', ''))
      } else {
        // No unit specified, assume grams
        weight = parseFloat(weightStr)
      }

      if (!isNaN(weight)) {
        return { weight }
      }
    }

    // PROX: Proximity sensor reading
    if (cleanLine.startsWith(CommandPrefix.PROX)) {
      const proximityStr = cleanLine.substring(CommandPrefix.PROX.length).trim()

      // Skip status messages
      if (isValidProximityStatus(proximityStr)) {
        return null
      }

      const parts = proximityStr.split(',')
      const proximity = parseInt(parts[0])

      // VL53L0X can measure up to 2000mm
      if (!isNaN(proximity) && proximity >= 0 && proximity <= 2000) {
        const sensors = { ...currentStatus.sensors }

        // Parse position if provided
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i].trim()
          if (part.startsWith('POS:')) {
            const position = part.substring(4)
            sensors.posAlta = position === ElevatorStatus.UP
            sensors.posBaja = position === ElevatorStatus.DOWN
          }
        }

        // Default thresholds if no position provided
        if (!parts.some((p) => p.trim().startsWith('POS:'))) {
          sensors.posAlta = proximity > 100
          sensors.posBaja = proximity <= 20
        }

        return {
          proximityDistance: proximity,
          sensors,
        }
      }
    }

    // HB: Heartbeat with state
    if (cleanLine.startsWith(CommandPrefix.HB)) {
      const parts = cleanLine.substring(CommandPrefix.HB.length).split(',')
      if (parts.length >= 1) {
        const state = parts[0].trim()
        if (state && isValidMachineState(state)) {
          return { state, lastHeartbeat: Date.now() }
        }
      }
    }

    // ELEVATOR: Position updates
    if (cleanLine.startsWith(CommandPrefix.ELEVATOR)) {
      const position = cleanLine.substring(CommandPrefix.ELEVATOR.length).trim()

      if (position === ElevatorStatus.BLOCKED_TOP || position === ElevatorStatus.BLOCKED_BOTTOM) {
        return null
      }

      const hardware = {
        elevator: currentStatus.hardware?.elevator || ElevatorStatus.IDLE,
        dosing: currentStatus.hardware?.dosing || DosingStatus.IDLE,
        grinder: currentStatus.hardware?.grinder || GrinderStatus.OFF,
        transfer: currentStatus.hardware?.transfer || TransferStatus.CLOSED,
        cap: currentStatus.hardware?.cap || CapStatus.RETRACTED,
        weight: currentStatus.hardware?.weight || 0,
      }

      // Map the position string to the correct elevator status
      switch (position) {
        case ElevatorStatus.UP:
          hardware.elevator = ElevatorStatus.UP
          break
        case ElevatorStatus.DOWN:
          hardware.elevator = ElevatorStatus.DOWN
          break
        case ElevatorStatus.MOVING_UP:
          hardware.elevator = ElevatorStatus.MOVING_UP
          break
        case ElevatorStatus.MOVING_DOWN:
          hardware.elevator = ElevatorStatus.MOVING_DOWN
          break
        case ElevatorStatus.MIDDLE:
          hardware.elevator = ElevatorStatus.MIDDLE
          break
        case ElevatorStatus.IDLE:
          hardware.elevator = ElevatorStatus.IDLE
          break
        default:
          hardware.elevator = ElevatorStatus.IDLE
      }

      return { hardware }
    }

    // DOSING: Motor status
    if (cleanLine.startsWith(CommandPrefix.DOSING)) {
      const status = cleanLine.substring(CommandPrefix.DOSING.length).trim()
      const hardware = {
        elevator: currentStatus.hardware?.elevator || ElevatorStatus.IDLE,
        dosing: currentStatus.hardware?.dosing || DosingStatus.IDLE,
        grinder: currentStatus.hardware?.grinder || GrinderStatus.OFF,
        transfer: currentStatus.hardware?.transfer || TransferStatus.CLOSED,
        cap: currentStatus.hardware?.cap || CapStatus.RETRACTED,
        weight: currentStatus.hardware?.weight || 0,
        dosingSteps: 0,
      }

      // Handle different dosing statuses
      if (status === 'FWD') {
        hardware.dosing = DosingStatus.FWD
      } else if (status === 'BWD') {
        hardware.dosing = DosingStatus.BWD
      } else if (status === 'ONE_PILL') {
        hardware.dosing = DosingStatus.STEP
      } else if (status === 'STOPPED' || status === 'COMPLETE') {
        hardware.dosing = DosingStatus.IDLE
      } else if (status.startsWith('STEPS:')) {
        // Parse step count for animation
        const steps = parseInt(status.substring(6))
        hardware.dosing = DosingStatus.STEP
        // Store steps in the hardware status for animation
        hardware.dosingSteps = steps
      } else {
        hardware.dosing = DosingStatus.IDLE
      }

      return { hardware }
    }

    // GRINDER: Motor status
    if (cleanLine.startsWith(CommandPrefix.GRINDER)) {
      const status = cleanLine.substring(CommandPrefix.GRINDER.length).trim()

      // Handle safety block message
      if (status === 'BLOCKED_NOT_AT_TOP') {
        console.error('⚠️ GRINDER BLOCKED: Elevator must be at TOP position')
        toast.error('Molino bloqueado: El elevador debe estar ARRIBA', {
          duration: 5000,
          id: 'grinder-safety-block',
        })
        return null
      }

      const hardware = {
        elevator: currentStatus.hardware?.elevator || ElevatorStatus.IDLE,
        dosing: currentStatus.hardware?.dosing || DosingStatus.IDLE,
        grinder: currentStatus.hardware?.grinder || GrinderStatus.OFF,
        transfer: currentStatus.hardware?.transfer || TransferStatus.CLOSED,
        cap: currentStatus.hardware?.cap || CapStatus.RETRACTED,
        weight: currentStatus.hardware?.weight || 0,
      }

      hardware.grinder = status === GrinderStatus.ON ? GrinderStatus.ON : GrinderStatus.OFF

      return { hardware }
    }

    // TRANSFER: Solenoid status
    if (cleanLine.startsWith(CommandPrefix.TRANSFER)) {
      const status = cleanLine.substring(CommandPrefix.TRANSFER.length).trim()
      const hardware = {
        elevator: currentStatus.hardware?.elevator || ElevatorStatus.IDLE,
        dosing: currentStatus.hardware?.dosing || DosingStatus.IDLE,
        grinder: currentStatus.hardware?.grinder || GrinderStatus.OFF,
        transfer: currentStatus.hardware?.transfer || TransferStatus.CLOSED,
        cap: currentStatus.hardware?.cap || CapStatus.RETRACTED,
        weight: currentStatus.hardware?.weight || 0,
      }

      hardware.transfer =
        status === TransferStatus.OPEN ? TransferStatus.OPEN : TransferStatus.CLOSED

      return { hardware }
    }

    // CAP: Solenoid status
    if (cleanLine.startsWith(CommandPrefix.CAP)) {
      const status = cleanLine.substring(CommandPrefix.CAP.length).trim()
      const hardware = {
        elevator: currentStatus.hardware?.elevator || ElevatorStatus.IDLE,
        dosing: currentStatus.hardware?.dosing || DosingStatus.IDLE,
        grinder: currentStatus.hardware?.grinder || GrinderStatus.OFF,
        transfer: currentStatus.hardware?.transfer || TransferStatus.CLOSED,
        cap: currentStatus.hardware?.cap || CapStatus.RETRACTED,
        weight: currentStatus.hardware?.weight || 0,
      }

      hardware.cap = status === CapStatus.PUSHED ? CapStatus.PUSHED : CapStatus.RETRACTED

      return { hardware }
    }

    // SENSORS: Direct sensor updates
    if (cleanLine.startsWith(CommandPrefix.SENSORS)) {
      const sensors = { ...currentStatus.sensors }
      const parts = cleanLine.split(':')

      if (parts.length >= 3) {
        const sensorName = parts[1] as SensorName
        const value = parts[2] === '1' || parts[2] === 'ON'

        switch (sensorName) {
          case SensorName.CONTAINER:
            sensors.frascoVacio = value
            break
          case SensorName.PILLS:
            sensors.pastillasCargadas = value
            break
          case SensorName.WEIGHT_STABLE:
            sensors.weightStable = value
            break
          case SensorName.POS_ALTA:
            sensors.posAlta = value
            break
          case SensorName.POS_BAJA:
            sensors.posBaja = value
            break
        }

        return { sensors }
      }
    }

    // MODE: Mode changes
    if (cleanLine.startsWith(CommandPrefix.MODE)) {
      // Mode is stored in UIStore, not SystemStatus
      // Just ignore mode messages here
      return null
    }

    // RESTRICTIONS: Physical restrictions
    if (cleanLine.startsWith(CommandPrefix.RESTRICTIONS)) {
      const state = cleanLine.substring(CommandPrefix.RESTRICTIONS.length).trim()
      return {
        physicalRestrictions: state === RestrictionStatus.ON || state === RestrictionStatus.ENABLED,
      }
    }

    // PROGRESS: State progress
    if (cleanLine.startsWith(CommandPrefix.PROGRESS)) {
      const match = cleanLine.match(/PROGRESS:([^,]+),(\d+)/)
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

    // EMERGENCY: Physical button events
    if (cleanLine.startsWith(CommandPrefix.EMERGENCY)) {
      const status = cleanLine.substring(CommandPrefix.EMERGENCY.length).trim()

      // Handle button press/release
      if (status === 'BUTTON_PRESSED' || status === 'ACTIVATED') {
        return { isEmergencyStopped: true }
      } else if (status === 'BUTTON_RELEASED' || status === 'DEACTIVATED') {
        return { isEmergencyStopped: false }
      }

      // Ignore other emergency messages
      return null
    }

    // START: Physical start button events
    if (cleanLine.startsWith('START:')) {
      const status = cleanLine.substring(6).trim()

      // Just log these for now, UI can handle start button differently
      if (status === 'BUTTON_PRESSED') {
        console.log('Physical START button pressed')
      } else if (status === 'BUTTON_RELEASED') {
        console.log('Physical START button released')
      }

      return null
    }

    // Ignore confirmation messages
    const ignorePrefixes = [
      CommandPrefix.BTN,
      CommandPrefix.SET,
      CommandPrefix.CMD,
      CommandPrefix.LOADCELL,
      CommandPrefix.HOMING,
      CommandPrefix.AUTO,
      CommandPrefix.MANUAL,
      CommandPrefix.WARNING,
      CommandPrefix.ERROR,
      CommandPrefix.DEBUG,
    ]

    if (ignorePrefixes.some((prefix) => cleanLine.startsWith(prefix))) {
      return null
    }

    return null
  }

  static getMessageType = getMessageType

  static parseDelays(line: string): Record<string, number> | null {
    // Handle DELAYS response from GET:DELAYS
    if (line.startsWith(CommandPrefix.DELAYS)) {
      const result: Record<string, number> = {}
      const parts = line.substring(CommandPrefix.DELAYS.length).split(',')

      parts.forEach((part) => {
        const [key, value] = part.split(':')
        if (key && value) {
          const mappedKey = DelayKeyMap[key.toLowerCase()] || key.toLowerCase()
          result[mappedKey] = parseInt(value)
        }
      })

      return Object.keys(result).length > 0 ? result : null
    }

    return null
  }

  static parseDosing(line: string): Record<string, number> | null {
    // Handle DOSING response from GET:DOSING
    if (line.startsWith(CommandPrefix.DOSING)) {
      const result: Record<string, number> = {}
      const parts = line.substring(CommandPrefix.DOSING.length).split(',')

      parts.forEach((part) => {
        const [key, value] = part.split(':')
        if (key && value) {
          result[key.toLowerCase()] = parseInt(value)
        }
      })

      return Object.keys(result).length > 0 ? result : null
    }

    return null
  }

  static parseElevator(line: string): Record<string, number> | null {
    // Handle ELEVATOR response from GET:ELEVATOR
    // Format: "ELEVATOR:speed:800,min_speed:100,max_speed:2000"
    if (line.startsWith(CommandPrefix.ELEVATOR)) {
      const content = line.substring(CommandPrefix.ELEVATOR.length)

      // Skip position updates (UP, DOWN, MOVING_UP, etc)
      if (!content.includes(':')) {
        return null
      }

      const result: Record<string, number> = {}
      const parts = content.split(',')

      parts.forEach((part) => {
        const [key, value] = part.split(':')
        if (key && value) {
          result[key.toLowerCase()] = parseInt(value)
        }
      })

      return Object.keys(result).length > 0 ? result : null
    }

    return null
  }

  static parseTimeouts(line: string): Record<string, number> | null {
    // Handle TIMEOUTS response from GET:TIMEOUTS
    // Format: "TIMEOUTS:transfer_max:10000,cap_max:10000,grinder_max:30000"
    if (line.startsWith('TIMEOUTS:')) {
      const result: Record<string, number> = {}
      const parts = line.substring('TIMEOUTS:'.length).split(',')

      parts.forEach((part) => {
        const [key, value] = part.split(':')
        if (key && value) {
          result[key.toLowerCase()] = parseInt(value)
        }
      })

      return Object.keys(result).length > 0 ? result : null
    }

    return null
  }
}
