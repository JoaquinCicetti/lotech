import { create } from 'zustand'

export type CameraPreset = 'free' | 'isometric' | 'front' | 'side' | 'top'

export interface CameraPosition {
  position: [number, number, number]
  target: [number, number, number]
}

// Machine is now on the gaming table
const MACHINE_CENTER: [number, number, number] = [1, 7.8, -7.5]

export const CAMERA_PRESETS: Record<CameraPreset, CameraPosition> = {
  free: {
    position: [11, 14, 2], // Far diagonal view
    target: MACHINE_CENTER,
  },
  isometric: {
    position: [8, 11, -15], // Isometric view from top right
    target: MACHINE_CENTER,
  },
  side: {
    position: [1, 9, -19], // Shows lateral view (this is what "Lateral" button uses)
    target: MACHINE_CENTER,
  },
  front: {
    position: [10, 10, -6.5], // Shows frontal view (this is what "Frontal" button uses)
    target: MACHINE_CENTER,
  },
  top: {
    position: [1, 20, -7.5], // Bird's eye view (directly above)
    target: MACHINE_CENTER,
  },
}

interface CameraStore {
  currentPreset: CameraPreset
  isTransitioning: boolean

  setPreset: (preset: CameraPreset) => void
  setTransitioning: (transitioning: boolean) => void
}

export const useCameraStore = create<CameraStore>((set) => ({
  currentPreset: 'isometric',
  isTransitioning: false,

  setPreset: (preset) => set({ currentPreset: preset }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
}))
