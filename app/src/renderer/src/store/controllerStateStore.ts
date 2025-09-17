import { CapStatus, DosingStatus, ElevatorStatus, GrinderStatus, TransferStatus } from '@renderer/serial/commands'
import { HardwareStatus, MachineState, SystemStatus } from '@renderer/types'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ControllerState {
  machineState: MachineState
  isRunning: boolean
  isPaused: boolean
  isSimulating: boolean
  error: string | null
  physicalRestrictions: boolean

  sensorReadings: {
    loadCell: number
    proximityDistance: number
    posAlta: boolean
    posBaja: boolean
    weightStable: boolean
    frascoVacio: boolean
    pastillasCargadas: boolean
  }

  hardwareStatus: HardwareStatus

  pillCount: number
  currentWeight: number
  lastHeartbeat: number

  stateProgress: {
    state: string
    expectedDuration: number
    startTime: number
  } | null

  updateFromSystemStatus: (status: Partial<SystemStatus>) => void
  setMachineState: (state: MachineState) => void
  setRunning: (running: boolean) => void
  setPaused: (paused: boolean) => void
  setSimulating: (simulating: boolean) => void
  setError: (error: string | null) => void
  setPhysicalRestrictions: (enabled: boolean) => void
  updateSensorReading: (sensor: string, value: number) => void
  resetState: () => void
}

const INITIAL_HARDWARE: HardwareStatus = {
  elevator: ElevatorStatus.DOWN,
  dosing: DosingStatus.IDLE,
  grinder: GrinderStatus.OFF,
  transfer: TransferStatus.CLOSED,
  cap: CapStatus.RETRACTED,
  weight: 0,
}

const INITIAL_SENSORS = {
  loadCell: 0,
  proximityDistance: 0,
  posAlta: false,
  posBaja: true,
  weightStable: false,
  frascoVacio: true,
  pastillasCargadas: true,
}

export const useControllerStateStore = create<ControllerState>()(
  subscribeWithSelector((set) => ({
    machineState: MachineState.INICIO,
    isRunning: false,
    isPaused: false,
    isSimulating: false,
    error: null,
    physicalRestrictions: true,

    sensorReadings: INITIAL_SENSORS,
    hardwareStatus: INITIAL_HARDWARE,

    pillCount: 0,
    currentWeight: 0,
    lastHeartbeat: Date.now(),
    stateProgress: null,

    updateFromSystemStatus: (status) =>
      set((state) => {
        const newState: Partial<ControllerState> = {}

        // Initialize sensorReadings with current state
        const updatedSensorReadings = { ...state.sensorReadings }
        let sensorChanged = false

        if (status.state !== undefined) {
          newState.machineState = status.state
        }

        if (status.pillCount !== undefined) {
          newState.pillCount = status.pillCount
        }

        if (status.weight !== undefined) {
          newState.currentWeight = status.weight
          updatedSensorReadings.loadCell = status.weight
          sensorChanged = true
        }

        if (status.proximityDistance !== undefined) {
          updatedSensorReadings.proximityDistance = status.proximityDistance
          sensorChanged = true
        }

        if (status.sensors) {
          // Only update the sensor boolean values, not proximity or loadCell
          updatedSensorReadings.posAlta = status.sensors.posAlta ?? updatedSensorReadings.posAlta
          updatedSensorReadings.posBaja = status.sensors.posBaja ?? updatedSensorReadings.posBaja
          updatedSensorReadings.weightStable =
            status.sensors.weightStable ?? updatedSensorReadings.weightStable
          updatedSensorReadings.frascoVacio =
            status.sensors.frascoVacio ?? updatedSensorReadings.frascoVacio
          updatedSensorReadings.pastillasCargadas =
            status.sensors.pastillasCargadas ?? updatedSensorReadings.pastillasCargadas
          sensorChanged = true
        }

        // Only update sensorReadings if there were changes
        if (sensorChanged) {
          newState.sensorReadings = updatedSensorReadings
        }

        if (status.hardware) {
          newState.hardwareStatus = status.hardware
        }

        if (status.lastHeartbeat !== undefined) {
          newState.lastHeartbeat = status.lastHeartbeat
        }

        if (status.stateProgress !== undefined) {
          newState.stateProgress = status.stateProgress
        }

        if (status.physicalRestrictions !== undefined) {
          newState.physicalRestrictions = status.physicalRestrictions
        }

        return { ...state, ...newState }
      }),

    setMachineState: (machineState) => set({ machineState }),
    setRunning: (isRunning) => set({ isRunning }),
    setPaused: (isPaused) => set({ isPaused }),
    setSimulating: (isSimulating) => set({ isSimulating }),
    setError: (error) => set({ error }),
    setPhysicalRestrictions: (physicalRestrictions) => set({ physicalRestrictions }),

    updateSensorReading: (sensor, value) =>
      set((state) => ({
        sensorReadings: {
          ...state.sensorReadings,
          [sensor]: value,
        },
      })),

    resetState: () =>
      set({
        machineState: MachineState.INICIO,
        isRunning: false,
        isPaused: false,
        isSimulating: false,
        error: null,
        sensorReadings: INITIAL_SENSORS,
        hardwareStatus: INITIAL_HARDWARE,
        pillCount: 0,
        currentWeight: 0,
        stateProgress: null,
      }),
  }))
)
