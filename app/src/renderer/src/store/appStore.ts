import { DEFAULT_DELAYS, DEFAULT_DOSING, DEFAULT_VIEW } from '@renderer/constants/settings'
import {
  DelaySettings,
  DosingSettings,
  MachineState,
  SerialPortInfo,
  SystemStatus,
  ViewMode,
} from '@renderer/types'
import { create } from 'zustand'

interface PendingCommand {
  command: string
  timestamp: number
  onConfirm?: (value: any) => void
  onTimeout?: () => void
  timeoutMs?: number
}

interface AppState {
  // Connection state
  ports: SerialPortInfo[]
  selectedPort: string
  isConnected: boolean
  connectionError: string | null
  lastMessageTime: number

  // Serial data
  serialData: string[]

  // System status
  systemStatus: SystemStatus

  // UI state
  showConsole: boolean
  simulationMode: boolean
  currentView: ViewMode

  // Settings
  currentDelays: DelaySettings
  currentDosing: DosingSettings
  
  // Command queue and pending confirmations
  commandQueue: string[]
  isProcessingCommand: boolean
  pendingConfirmations: Map<string, PendingCommand>

  // Actions
  setPorts: (ports: SerialPortInfo[]) => void
  setSelectedPort: (port: string) => void
  setConnected: (connected: boolean) => void
  setConnectionError: (error: string | null) => void
  setLastMessageTime: (time: number) => void
  addSerialData: (line: string) => void
  clearSerialData: () => void
  updateSystemStatus: (update: Partial<SystemStatus>) => void
  setShowConsole: (show: boolean) => void
  setSimulationMode: (mode: boolean) => void
  setCurrentView: (view: ViewMode) => void
  setCurrentDelays: (delays: DelaySettings) => void
  setCurrentDosing: (dosing: DosingSettings) => void
  
  // Command queue actions
  queueCommand: (command: string) => void
  dequeueCommand: () => string | undefined
  setProcessingCommand: (processing: boolean) => void
  addPendingConfirmation: (key: string, command: PendingCommand) => void
  removePendingConfirmation: (key: string) => void
  getPendingConfirmation: (key: string) => PendingCommand | undefined
}

const INITIAL_STATUS: SystemStatus = {
  state: MachineState.INICIO,
  pillCount: 0,
  weight: 0,
  sensors: {
    posAlta: false,
    posBaja: true,
    weightStable: false,
    frascoVacio: true,
    pastillasCargadas: true,
  },
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  ports: [],
  selectedPort: '',
  isConnected: false,
  connectionError: null,
  lastMessageTime: Date.now(),
  serialData: [],
  systemStatus: INITIAL_STATUS,
  showConsole: false,
  simulationMode: true,
  currentView: DEFAULT_VIEW.viewMode,
  currentDelays: DEFAULT_DELAYS,
  currentDosing: DEFAULT_DOSING,
  commandQueue: [],
  isProcessingCommand: false,
  pendingConfirmations: new Map(),

  // Actions
  setPorts: (ports) => set({ ports }),
  setSelectedPort: (selectedPort) => set({ selectedPort }),
  setConnected: (isConnected) => set({ isConnected }),
  setConnectionError: (connectionError) => set({ connectionError }),
  setLastMessageTime: (lastMessageTime) => set({ lastMessageTime }),
  addSerialData: (line) =>
    set((state) => ({
      serialData: [...state.serialData, `[${new Date().toLocaleTimeString()}] ${line}`].slice(-100),
    })),
  clearSerialData: () => set({ serialData: [] }),
  updateSystemStatus: (update) =>
    set((state) => ({
      systemStatus: { ...state.systemStatus, ...update },
    })),
  setShowConsole: (showConsole) => set({ showConsole }),
  setSimulationMode: (simulationMode) => set({ simulationMode }),
  setCurrentView: (currentView) => set({ currentView }),
  setCurrentDelays: (currentDelays) => set({ currentDelays }),
  setCurrentDosing: (currentDosing) => set({ currentDosing }),
  
  // Command queue actions
  queueCommand: (command) => set((state) => ({
    commandQueue: [...state.commandQueue, command]
  })),
  dequeueCommand: () => {
    const state = useAppStore.getState()
    const [first, ...rest] = state.commandQueue
    if (first) {
      set({ commandQueue: rest })
    }
    return first
  },
  setProcessingCommand: (isProcessingCommand) => set({ isProcessingCommand }),
  addPendingConfirmation: (key, command) => set((state) => {
    const newMap = new Map(state.pendingConfirmations)
    newMap.set(key, command)
    return { pendingConfirmations: newMap }
  }),
  removePendingConfirmation: (key) => set((state) => {
    const newMap = new Map(state.pendingConfirmations)
    newMap.delete(key)
    return { pendingConfirmations: newMap }
  }),
  getPendingConfirmation: (key) => {
    const state = useAppStore.getState()
    return state.pendingConfirmations.get(key)
  },
}))
