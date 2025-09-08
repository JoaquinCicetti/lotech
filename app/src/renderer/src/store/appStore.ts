import { create } from 'zustand'

interface MachineState {
  isConnected: boolean
  machineState: string
  loadCellReadings: number[]
  motorsStatus: {
    motor1: boolean
    motor2: boolean
  }
  solenoidsStatus: {
    solenoid1: boolean
    solenoid2: boolean
    solenoid3: boolean
  }
  setConnected: (connected: boolean) => void
  setMachineState: (state: string) => void
  setLoadCellReading: (index: number, weight: number) => void
  setMotorStatus: (motor: 'motor1' | 'motor2', status: boolean) => void
  setSolenoidStatus: (solenoid: 'solenoid1' | 'solenoid2' | 'solenoid3', status: boolean) => void
}

export const useAppStore = create<MachineState>((set) => ({
  isConnected: false,
  machineState: 'IDLE',
  loadCellReadings: Array(9).fill(0),
  motorsStatus: {
    motor1: false,
    motor2: false,
  },
  solenoidsStatus: {
    solenoid1: false,
    solenoid2: false,
    solenoid3: false,
  },
  setConnected: (connected) => set({ isConnected: connected }),
  setMachineState: (state) => set({ machineState: state }),
  setLoadCellReading: (index, weight) =>
    set((state) => {
      const newReadings = [...state.loadCellReadings]
      newReadings[index] = weight
      return { loadCellReadings: newReadings }
    }),
  setMotorStatus: (motor, status) =>
    set((state) => ({
      motorsStatus: { ...state.motorsStatus, [motor]: status },
    })),
  setSolenoidStatus: (solenoid, status) =>
    set((state) => ({
      solenoidsStatus: { ...state.solenoidsStatus, [solenoid]: status },
    })),
}))
