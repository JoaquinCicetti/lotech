import {
  DEFAULT_DELAYS,
  DEFAULT_DOSING,
  DEFAULT_ELEVATOR,
  DEFAULT_LED,
  DEFAULT_LOADCELL,
  DEFAULT_PROXIMITY,
  DEFAULT_TIMEOUTS,
  DEFAULT_WEIGHT_FILTER,
} from '@renderer/constants/settings'
import {
  DelaySettings,
  DosingSettings,
  ElevatorSettings,
  HardwareTimeouts,
  LEDColor,
  LEDSettings,
  LoadCellSettings,
  ProximitySettings,
  WeightFilterSettings,
} from '@renderer/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SettingsStore {
  delays: DelaySettings
  dosing: DosingSettings
  proximity: ProximitySettings
  elevator: ElevatorSettings
  timeouts: HardwareTimeouts
  loadCell: LoadCellSettings
  led: LEDSettings
  weightFilter: WeightFilterSettings

  setDelays: (delays: DelaySettings) => void
  setDosing: (dosing: DosingSettings) => void
  setProximity: (proximity: ProximitySettings) => void
  setElevator: (elevator: ElevatorSettings) => void
  setTimeouts: (timeouts: HardwareTimeouts) => void
  setLoadCell: (loadCell: LoadCellSettings) => void
  setLED: (led: LEDSettings) => void
  setWeightFilter: (weightFilter: WeightFilterSettings) => void
  updateDelay: (key: keyof DelaySettings, value: number) => void
  updateDosing: (key: keyof DosingSettings, value: number) => void
  updateProximity: (key: keyof ProximitySettings, value: number) => void
  updateElevator: (key: keyof ElevatorSettings, value: number) => void
  updateTimeout: (key: keyof HardwareTimeouts, value: number) => void
  updateLoadCell: (key: keyof LoadCellSettings, value: number) => void
  updateWeightFilter: (key: keyof WeightFilterSettings, value: number) => void
  updateLEDBrightness: (brightness: number) => void
  updateLEDColor: (index: number, color: LEDColor) => void
  setAllLEDColors: (color: LEDColor) => void
  clearAllLEDs: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      delays: DEFAULT_DELAYS,
      dosing: DEFAULT_DOSING,
      proximity: DEFAULT_PROXIMITY,
      elevator: DEFAULT_ELEVATOR,
      timeouts: DEFAULT_TIMEOUTS,
      loadCell: DEFAULT_LOADCELL,
      led: DEFAULT_LED,
      weightFilter: {
        ...DEFAULT_WEIGHT_FILTER,
      },

      setDelays: (delays) => set({ delays }),
      setDosing: (dosing) => set({ dosing }),
      setProximity: (proximity) => set({ proximity }),
      setElevator: (elevator) => set({ elevator }),
      setTimeouts: (timeouts) => set({ timeouts }),
      setLoadCell: (loadCell) => set({ loadCell }),
      setLED: (led) => set({ led }),
      setWeightFilter: (weightFilter) => set({ weightFilter }),

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

      updateLoadCell: (key, value) =>
        set((state) => ({
          loadCell: { ...state.loadCell, [key]: value },
        })),

      updateWeightFilter: (key, value) =>
        set((state) => ({
          weightFilter: { ...state.weightFilter, [key]: value },
        })),

      updateLEDBrightness: (brightness) =>
        set((state) => ({
          led: { ...state.led, brightness },
        })),

      updateLEDColor: (index, color) =>
        set((state) => {
          const newColors = [...state.led.colors]
          newColors[index] = color
          return { led: { ...state.led, colors: newColors } }
        }),

      setAllLEDColors: (color) =>
        set((state) => ({
          led: {
            ...state.led,
            colors: Array.from({ length: 10 }, () => ({ ...color })),
          },
        })),

      clearAllLEDs: () =>
        set((state) => ({
          led: {
            ...state.led,
            colors: Array.from({ length: 10 }, () => ({ r: 0, g: 0, b: 0 })),
          },
        })),
    }),
    {
      name: 'lotech-settings',
      version: 1,
      migrate: (persistedState: unknown) => {
        const state = persistedState as Partial<SettingsStore>
        // Ensure compressionFactor exists in weightFilter
        if (state && state.weightFilter) {
          state.weightFilter = {
            ...DEFAULT_WEIGHT_FILTER,
            ...state.weightFilter,
          }
        }
        return state as SettingsStore
      },
    }
  )
)
