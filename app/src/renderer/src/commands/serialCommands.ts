import { useConnectionStore } from '@renderer/store/connectionStore'
import { DelaySettings } from '@renderer/types'
import {
  CapCommand,
  DosingCommand,
  ElevatorCommand,
  GrinderCommand,
  LoadCellCommand,
  ModeCommand,
  ProductionCommand,
  RestrictionCommand,
  SettingsCommands,
  StatusCommand,
  TransferCommand,
} from '../serial/commands'

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
    console.error('Error al enviar comando:', error)
    return false
  }
}

// Mode commands
export const setManualMode = () => sendSerial(ModeCommand.MANUAL)
export const setAutoMode = () => sendSerial(ModeCommand.AUTO)

// Safety restrictions
export const enableRestrictions = () => sendSerial(RestrictionCommand.ON)
export const disableRestrictions = () => sendSerial(RestrictionCommand.OFF)

// Production/Auto mode commands
export const startProduction = () => sendSerial(ProductionCommand.START)
export const stopProduction = () => sendSerial(ProductionCommand.STOP)
export const pauseProduction = () => sendSerial(ProductionCommand.PAUSE)
export const resumeProduction = () => sendSerial(ProductionCommand.RESUME)
export const emergencyStop = () => sendSerial(ProductionCommand.EMERGENCY_STOP)
export const homePosition = () => sendSerial(ProductionCommand.HOME)

// Test mode commands - Motor controls
export const testMotorForward = (motorId: string) => sendSerial(`MOTOR_FWD:${motorId}`)
export const testMotorBackward = (motorId: string) => sendSerial(`MOTOR_BWD:${motorId}`)
export const testMotorStop = (motorId: string) => sendSerial(`MOTOR_STOP:${motorId}`)

// Dosing motor specific commands for testing
export const testDosingForward = () => sendSerial(DosingCommand.FORWARD)
export const testDosingBackward = () => sendSerial(DosingCommand.BACKWARD)
export const testDosingStop = () => sendSerial(DosingCommand.STOP)

// Elevator motor commands
export const testElevatorUp = () => sendSerial(ElevatorCommand.UP)
export const testElevatorDown = () => sendSerial(ElevatorCommand.DOWN)
export const testElevatorStop = () => sendSerial(ElevatorCommand.STOP)

// Grinder motor commands
export const testGrinderOn = () => sendSerial(GrinderCommand.ON)
export const testGrinderOff = () => sendSerial(GrinderCommand.OFF)

// Solenoid commands
export const testSolenoidActivate = (solenoidId: string) => sendSerial(`SOLENOID_ON:${solenoidId}`)
export const testSolenoidDeactivate = (solenoidId: string) =>
  sendSerial(`SOLENOID_OFF:${solenoidId}`)

// Transfer solenoid
export const testTransferOpen = () => sendSerial(TransferCommand.OPEN)
export const testTransferClose = () => sendSerial(TransferCommand.CLOSE)

// Cap solenoid
export const testCapPush = () => sendSerial(CapCommand.PUSH)
export const testCapRetract = () => sendSerial(CapCommand.RETRACT)

// Load cell commands
export const testLoadCell = () => sendSerial(LoadCellCommand.TEST)
export const tareLoadCell = () => sendSerial(LoadCellCommand.TARE)
export const calibrateLoadCell = (weight: number) =>
  sendSerial(SettingsCommands.buildCalibrationCommand(weight))

// Settings commands
export const updateDelays = (delays: DelaySettings) => {
  const delaysObj: { [key: string]: number } = {
    settle: delays.settle,
    weight: delays.weight,
    transfer: delays.transfer,
    grind: delays.grind,
    cap: delays.cap,
    elevUp: delays.elevUp,
    elevDown: delays.elevDown,
  }
  return sendSerial(SettingsCommands.buildDelaysCommand(delaysObj))
}

export const updateDosing = (wheelDivisions: number, lotSize: number) =>
  sendSerial(SettingsCommands.buildDosingCommand(wheelDivisions, lotSize))

export const updateProximity = (min: number, max: number) =>
  sendSerial(SettingsCommands.buildProximityCommand(min, max))

// Status request
export const requestStatus = () => sendSerial(StatusCommand.STATUS)
export const requestSensors = () => sendSerial(StatusCommand.SENSORS)
