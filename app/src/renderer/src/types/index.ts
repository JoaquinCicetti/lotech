export interface SerialPortInfo {
  path: string
  friendlyName?: string
}

export enum MachineState {
  INICIO = 'INICIO',
  ASCENSOR = 'ASCENSOR',
  DOSIFICACION = 'DOSIF',
  PESAJE = 'PESAJE',
  TRASPASO = 'TRASPASO',
  MOLIENDA = 'MOLIENDA',
  DESCARGA = 'DESCARGA',
  CIERRE = 'CIERRE',
  RETIRO = 'RETIRO',
}

export interface ProximitySettings {
  minProximity: number
  maxProximity: number
}

export interface DelaySettings {
  settle: number
  weight: number
  transfer: number
  grind: number
  cap: number
  elevUp: number
  elevDown: number
}

export interface DosingSettings {
  wheelDivisions: number
  lotSize: number
  motorSpeed?: number // Radians per second for animation sync
}

export interface ElevatorSettings {
  speed: number // Steps per second
  minSpeed: number
  maxSpeed: number
}

export interface HardwareTimeouts {
  transferMax: number // Maximum time transfer solenoid can be ON (ms)
  capMax: number // Maximum time cap solenoid can be ON (ms)
  grinderMax: number // Maximum time grinder can run (ms)
}

export interface LoadCellSettings {
  calibrationFactor: number // HX711 calibration factor
  deadband: number // Noise filter - ignore weight changes smaller than this (grams)
}

export interface LEDColor {
  r: number // Red (0-255)
  g: number // Green (0-255)
  b: number // Blue (0-255)
}

export interface LEDSettings {
  brightness: number // Global brightness (0-255)
  colors: LEDColor[] // Array of 30 LED colors
}

export enum AppMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}

import type {
  CapStatus,
  DosingStatus,
  ElevatorStatus,
  GrinderStatus,
  TransferStatus,
} from '../serial/commands'

export interface HardwareStatus {
  elevator: Exclude<ElevatorStatus, ElevatorStatus.BLOCKED_TOP | ElevatorStatus.BLOCKED_BOTTOM>
  dosing: DosingStatus // Allow all dosing statuses for proper animation
  grinder: GrinderStatus
  transfer: TransferStatus
  cap: CapStatus
  weight: number
  dosingSteps?: number // Optional: number of steps for single pill dispense
}

export interface SystemStatus {
  state: MachineState
  pillCount: number
  weight?: number
  proximityDistance?: number
  lastHeartbeat?: number
  physicalRestrictions?: boolean
  isEmergencyStopped?: boolean
  stateProgress?: {
    state: string
    expectedDuration: number
    startTime: number
  }
  sensors: {
    posAlta: boolean
    posBaja: boolean
    weightStable: boolean
    frascoVacio: boolean
    pastillasCargadas: boolean
  }
  hardware?: HardwareStatus
}

export interface ProcessState {
  id: string
  name: string
  icon: React.ReactNode
}

export interface SerialAPI {
  list: () => Promise<SerialPortInfo[]>
  open: (opts: { path: string; baudRate: number }) => Promise<boolean>
  write: (args: { path: string; data: string | Uint8Array }) => Promise<boolean>
  close: (path: string) => Promise<boolean>
  onData: (cb: (p: { path: string; line: string }) => void) => (() => void) | undefined
  onError: (cb: (p: { path: string; error: string }) => void) => (() => void) | undefined
}

declare global {
  interface Window {
    serial: SerialAPI
  }
}
