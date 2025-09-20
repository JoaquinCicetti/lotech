import { DEFAULT_DELAYS, DEFAULT_DOSING, DEFAULT_ELEVATOR, DEFAULT_PROXIMITY, DEFAULT_TIMEOUTS } from '@renderer/constants/settings'
import { DelaySettings, DosingSettings, ElevatorSettings, HardwareTimeouts, ProximitySettings } from '@renderer/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SettingsStore {
  delays: DelaySettings
  dosing: DosingSettings
  proximity: ProximitySettings
  elevator: ElevatorSettings
  timeouts: HardwareTimeouts

  setDelays: (delays: DelaySettings) => void
  setDosing: (dosing: DosingSettings) => void
  setProximity: (proximity: ProximitySettings) => void
  setElevator: (elevator: ElevatorSettings) => void
  setTimeouts: (timeouts: HardwareTimeouts) => void
  updateDelay: (key: keyof DelaySettings, value: number) => void
  updateDosing: (key: keyof DosingSettings, value: number) => void
  updateProximity: (key: keyof ProximitySettings, value: number) => void
  updateElevator: (key: keyof ElevatorSettings, value: number) => void
  updateTimeout: (key: keyof HardwareTimeouts, value: number) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      delays: DEFAULT_DELAYS,
      dosing: DEFAULT_DOSING,
      proximity: DEFAULT_PROXIMITY,
      elevator: DEFAULT_ELEVATOR,
      timeouts: DEFAULT_TIMEOUTS,

      setDelays: (delays) => set({ delays }),
      setDosing: (dosing) => set({ dosing }),
      setProximity: (proximity) => set({ proximity }),
      setElevator: (elevator) => set({ elevator }),
      setTimeouts: (timeouts) => set({ timeouts }),

      updateDelay: (key, value) =>
        set((state) => ({
          delays: { ...state.delays, [key]: value },
        })),

      updateDosing: (key, value) =>
        set((state) => ({
          dosing: { ...state.dosing, [key]: value },
        })),

      updateProximity: (key, value) =>
        set((state) => ({
          proximity: { ...state.proximity, [key]: value },
        })),

      updateElevator: (key, value) =>
        set((state) => ({
          elevator: { ...state.elevator, [key]: value },
        })),

      updateTimeout: (key, value) =>
        set((state) => ({
          timeouts: { ...state.timeouts, [key]: value },
        })),
    }),
    {
      name: 'lotech-settings',
    }
  )
)
