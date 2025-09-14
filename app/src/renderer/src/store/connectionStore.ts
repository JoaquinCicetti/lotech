import { SerialPortInfo } from '@renderer/types'
import { create } from 'zustand'

interface ConnectionState {
  ports: SerialPortInfo[]
  selectedPort: string
  isConnected: boolean
  connectionError: string | null
  lastMessageTime: number
  serialData: string[]

  setPorts: (ports: SerialPortInfo[]) => void
  setSelectedPort: (port: string) => void
  setConnected: (connected: boolean) => void
  setConnectionError: (error: string | null) => void
  setLastMessageTime: (time: number) => void
  addSerialData: (line: string) => void
  clearSerialData: () => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  ports: [],
  selectedPort: '',
  isConnected: false,
  connectionError: null,
  lastMessageTime: Date.now(),
  serialData: [],

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
}))
