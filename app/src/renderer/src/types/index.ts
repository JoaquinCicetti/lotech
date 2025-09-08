export interface SerialPortInfo {
  path: string
  friendlyName?: string
}

export enum MachineState {
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
}

export enum ViewMode {
  STANDARD = 'dashboard',
  MODEL = '3d',
}

export interface ViewSettings {
  viewMode: ViewMode
}

export interface SystemStatus {
  state: MachineState
  pillCount: number
  targetPills: number
  weight?: number
  lastHeartbeat?: number
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
  onData: (cb: (p: { path: string; line: string }) => void) => void
  onError: (cb: (p: { path: string; error: string }) => void) => void
}

declare global {
  interface Window {
    serial: SerialAPI
  }
}
