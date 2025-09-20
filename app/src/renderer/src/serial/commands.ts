// Command prefixes for parsing
export enum CommandPrefix {
  STATE = 'STATE:',
  PILLS = 'PILLS:',
  WEIGHT = 'WEIGHT:',
  PROX = 'PROX:',
  HB = 'HB:',
  ELEVATOR = 'ELEVATOR:',
  DOSING = 'DOSING:',
  GRINDER = 'GRINDER:',
  TRANSFER = 'TRANSFER:',
  CAP = 'CAP:',
  SENSORS = 'SENSORS:',
  MODE = 'MODE:',
  RESTRICTIONS = 'RESTRICTIONS:',
  PROGRESS = 'PROGRESS:',
  DELAYS = 'DELAYS:',
  LOADCELL = 'LOADCELL:',
  HOMING = 'HOMING:',
  AUTO = 'AUTO:',
  MANUAL = 'MANUAL:',
  WARNING = 'WARNING:',
  ERROR = 'ERROR:',
  EMERGENCY = 'EMERGENCY:',
  DEBUG = 'DEBUG:',
  BTN = 'BTN:',
  SET = 'SET:',
  CMD = 'CMD:',
}

// Mode commands
export enum ModeCommand {
  MANUAL = 'MODE:MANUAL',
  AUTO = 'MODE:AUTO',
}

// Restriction commands
export enum RestrictionCommand {
  ON = 'RESTRICTIONS:ON',
  OFF = 'RESTRICTIONS:OFF',
}

// Production commands
export enum ProductionCommand {
  START = 'START',
  STOP = 'STOP',
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  EMERGENCY_STOP = 'EMERGENCY_STOP',
  HOME = 'HOME',
  RESET = 'RESET',
}

// Dosing motor commands
export enum DosingCommand {
  FORWARD = 'DOSING_FWD',
  BACKWARD = 'DOSING_BWD',
  STOP = 'DOSING_STOP',
}

// Elevator commands
export enum ElevatorCommand {
  UP = 'ELEVATOR_UP',
  DOWN = 'ELEVATOR_DOWN',
  STOP = 'ELEVATOR_STOP',
}

// Grinder commands
export enum GrinderCommand {
  ON = 'GRINDER_ON',
  OFF = 'GRINDER_OFF',
}

// Transfer solenoid commands
export enum TransferCommand {
  OPEN = 'TRANSFER_OPEN',
  CLOSE = 'TRANSFER_CLOSE',
}

// Cap solenoid commands
export enum CapCommand {
  PUSH = 'CAP_PUSH',
  RETRACT = 'CAP_RETRACT',
}

// Load cell commands
export enum LoadCellCommand {
  TEST = 'LOADCELL_TEST',
  TARE = 'LOADCELL_TARE',
}

// Status request commands
export enum StatusCommand {
  STATUS = 'STATUS',
  GET_DELAYS = 'GET:DELAYS',
  GET_DOSING = 'GET:DOSING',
  GET_ELEVATOR = 'GET:ELEVATOR',
  GET_TIMEOUTS = 'GET:TIMEOUTS',
  SENSORS = 'SENSORS',
}

// Response status values
export enum ElevatorStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  MOVING_UP = 'MOVING_UP',
  MOVING_DOWN = 'MOVING_DOWN',
  BLOCKED_TOP = 'BLOCKED_TOP',
  BLOCKED_BOTTOM = 'BLOCKED_BOTTOM',
  IDLE = 'IDLE',
  MIDDLE = 'MIDDLE',
}

export enum DosingStatus {
  FWD = 'FWD',
  BWD = 'BWD',
  STEP = 'STEP',
  ONE_PILL = 'ONE_PILL',
  STOPPED = 'STOPPED',
  COMPLETE = 'COMPLETE',
  ACTIVE = 'ACTIVE',
  IDLE = 'IDLE',
}

export enum GrinderStatus {
  ON = 'ON',
  OFF = 'OFF',
}

export enum TransferStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export enum CapStatus {
  PUSHED = 'PUSHED',
  RETRACTED = 'RETRACTED',
}

export enum SensorName {
  CONTAINER = 'CONTAINER',
  PILLS = 'PILLS',
  WEIGHT_STABLE = 'WEIGHT_STABLE',
  POS_ALTA = 'POS_ALTA',
  POS_BAJA = 'POS_BAJA',
}

export enum ProximityStatus {
  INIT_OK = 'INIT_OK',
  INIT_FAIL = 'INIT_FAIL',
  OK = 'OK',
  FAIL = 'FAIL',
  NA = 'NA',
}

export enum ModeStatus {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
}

export enum RestrictionStatus {
  ON = 'ON',
  OFF = 'OFF',
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
}

// Settings command builders
export class SettingsCommands {
  static buildDelaysCommand(delays: { [key: string]: number }): string {
    const delayString = Object.entries(delays)
      .map(([key, value]) => `${key}:${value}`)
      .join(',')
    return `SET_DELAYS:${delayString}`
  }

  static buildDosingCommand(wheelDivisions: number, lotSize: number, motorSpeed?: number): string {
    if (motorSpeed !== undefined) {
      return `SET_DOSING:${wheelDivisions},${lotSize},${motorSpeed}`
    }
    return `SET_DOSING:${wheelDivisions},${lotSize}`
  }

  static buildProximityCommand(min: number, max: number): string {
    return `SET_PROXIMITY:${min},${max}`
  }

  static buildCalibrationCommand(weight: number): string {
    return `LOADCELL_CAL:${weight}`
  }

  static buildElevatorCommand(speed: number): string {
    return `SET_ELEVATOR:speed:${speed}`
  }

  static buildTimeoutsCommand(timeouts: { transferMax: number; capMax: number; grinderMax: number }): string {
    return `SET_TIMEOUTS:transfer_max:${timeouts.transferMax},cap_max:${timeouts.capMax},grinder_max:${timeouts.grinderMax}`
  }
}

// Type guards
export function isValidElevatorStatus(status: string): status is ElevatorStatus {
  return Object.values(ElevatorStatus).includes(status as ElevatorStatus)
}

export function isValidDosingStatus(status: string): status is DosingStatus {
  return Object.values(DosingStatus).includes(status as DosingStatus)
}

export function isValidGrinderStatus(status: string): status is GrinderStatus {
  return Object.values(GrinderStatus).includes(status as GrinderStatus)
}

export function isValidTransferStatus(status: string): status is TransferStatus {
  return Object.values(TransferStatus).includes(status as TransferStatus)
}

export function isValidCapStatus(status: string): status is CapStatus {
  return Object.values(CapStatus).includes(status as CapStatus)
}

export function isValidProximityStatus(status: string): status is ProximityStatus {
  return Object.values(ProximityStatus).includes(status as ProximityStatus)
}

// Message type determination
export enum MessageType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
  DEBUG = 'debug',
}

export function getMessageType(line: string): MessageType {
  const cleanLine = line.trim()

  if (cleanLine.startsWith(CommandPrefix.ERROR)) return MessageType.ERROR
  if (cleanLine.startsWith(CommandPrefix.WARNING)) return MessageType.WARNING
  if (cleanLine.startsWith(CommandPrefix.EMERGENCY)) return MessageType.ERROR
  if (cleanLine.startsWith(CommandPrefix.STATE)) return MessageType.WARNING
  if (cleanLine.startsWith(CommandPrefix.BTN)) return MessageType.SUCCESS
  if (cleanLine.startsWith(CommandPrefix.SET)) return MessageType.SUCCESS
  if (cleanLine.startsWith(CommandPrefix.HB)) return MessageType.DEBUG
  if (cleanLine.startsWith(CommandPrefix.MODE)) return MessageType.INFO
  if (cleanLine.startsWith(CommandPrefix.AUTO)) return MessageType.SUCCESS
  if (cleanLine.startsWith(CommandPrefix.MANUAL)) return MessageType.INFO
  if (cleanLine.startsWith(CommandPrefix.HOMING)) return MessageType.INFO
  if (cleanLine.startsWith(CommandPrefix.DEBUG)) return MessageType.DEBUG

  return MessageType.INFO
}

// Delay key mapping
export const DelayKeyMap: Record<string, string> = {
  settle: 'settle',
  weight: 'weight',
  transfer: 'transfer',
  grind: 'grind',
  cap: 'cap',
  elevup: 'elevUp',
  elevdown: 'elevDown',
}
