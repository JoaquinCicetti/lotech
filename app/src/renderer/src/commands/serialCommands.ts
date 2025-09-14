import { useConnectionStore } from '@renderer/store/connectionStore'
import { DelaySettings } from '@renderer/types'

const sendSerial = async (command: string): Promise<boolean> => {
  const { selectedPort, isConnected } = useConnectionStore.getState()

  if (!isConnected || !selectedPort) {
    console.error('Not connected to serial port')
    return false
  }

  try {
    const success = await window.serial.write({ path: selectedPort, data: command + '\n' })
    if (success) {
      useConnectionStore.getState().addSerialData(`> ${command}`)
    }
    return success
  } catch (error) {
    console.error('Failed to send command:', error)
    return false
  }
}

// Mode commands
export const setManualMode = () => sendSerial('MODE:MANUAL')
export const setAutoMode = () => sendSerial('MODE:AUTO')

// Production/Auto mode commands
export const startProduction = () => sendSerial('START')
export const stopProduction = () => sendSerial('STOP')
export const pauseProduction = () => sendSerial('PAUSE')
export const resumeProduction = () => sendSerial('RESUME')
export const emergencyStop = () => sendSerial('EMERGENCY_STOP')
export const homePosition = () => sendSerial('HOME')

// Test mode commands - Motor controls
export const testMotorForward = (motorId: string) => sendSerial(`MOTOR_FWD:${motorId}`)
export const testMotorBackward = (motorId: string) => sendSerial(`MOTOR_BWD:${motorId}`)
export const testMotorStop = (motorId: string) => sendSerial(`MOTOR_STOP:${motorId}`)

// Dosing motor specific commands for testing
export const testDosingForward = () => sendSerial('DOSING_FWD')
export const testDosingBackward = () => sendSerial('DOSING_BWD')
export const testDosingStop = () => sendSerial('DOSING_STOP')

// Elevator motor commands
export const testElevatorUp = () => sendSerial('ELEVATOR_UP')
export const testElevatorDown = () => sendSerial('ELEVATOR_DOWN')
export const testElevatorStop = () => sendSerial('ELEVATOR_STOP')

// Grinder motor commands
export const testGrinderOn = () => sendSerial('GRINDER_ON')
export const testGrinderOff = () => sendSerial('GRINDER_OFF')

// Solenoid commands
export const testSolenoidActivate = (solenoidId: string) => sendSerial(`SOLENOID_ON:${solenoidId}`)
export const testSolenoidDeactivate = (solenoidId: string) =>
  sendSerial(`SOLENOID_OFF:${solenoidId}`)

// Transfer solenoid
export const testTransferOpen = () => sendSerial('TRANSFER_OPEN')
export const testTransferClose = () => sendSerial('TRANSFER_CLOSE')

// Cap solenoid
export const testCapPush = () => sendSerial('CAP_PUSH')
export const testCapRetract = () => sendSerial('CAP_RETRACT')

// Load cell commands
export const testLoadCell = () => sendSerial('LOADCELL_TEST')
export const tareLoadCell = () => sendSerial('LOADCELL_TARE')
export const calibrateLoadCell = (weight: number) => sendSerial(`LOADCELL_CAL:${weight}`)

// Settings commands
export const updateDelays = (delays: DelaySettings) => {
  const delayString = Object.entries(delays)
    .map(([key, value]) => `${key}:${value}`)
    .join(',')
  return sendSerial(`SET_DELAYS:${delayString}`)
}

export const updateDosing = (wheelDivisions: number, lotSize: number) =>
  sendSerial(`SET_DOSING:${wheelDivisions},${lotSize}`)

export const updateProximity = (min: number, max: number) =>
  sendSerial(`SET_PROXIMITY:${min},${max}`)

// Status request
export const requestStatus = () => sendSerial('STATUS')
export const requestSensors = () => sendSerial('SENSORS')
