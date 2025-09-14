import { DEFAULT_DELAYS, DEFAULT_DOSING, DEFAULT_PROXIMITY } from '@renderer/constants/settings'
import { DelaySettings, DosingSettings, ProximitySettings } from '@renderer/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  delays: DelaySettings
  dosing: DosingSettings
  proximity: ProximitySettings

  setDelays: (delays: DelaySettings) => void
  setDosing: (dosing: DosingSettings) => void
  setProximity: (proximity: ProximitySettings) => void
  updateDelay: (key: keyof DelaySettings, value: number) => void
  updateDosing: (key: keyof DosingSettings, value: number) => void
  updateProximity: (key: keyof ProximitySettings, value: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      delays: DEFAULT_DELAYS,
      dosing: DEFAULT_DOSING,
      proximity: DEFAULT_PROXIMITY,

      setDelays: (delays) => set({ delays }),
      setDosing: (dosing) => set({ dosing }),
      setProximity: (proximity) => set({ proximity }),

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
    }),
    {
      name: 'lotech-settings',
    }
  )
)
