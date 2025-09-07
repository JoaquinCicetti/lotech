export interface SerialPortInfo {
  path: string
  friendlyName?: string
}

export interface SystemStatus {
  state: string
  pillCount: number
  targetPills: number
  weight?: number
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
}

declare global {
  interface Window {
    serial: SerialAPI
  }
}
