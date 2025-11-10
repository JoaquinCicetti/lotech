import { create } from 'zustand'

export type CameraPreset = 'free' | 'isometric' | 'front' | 'side' | 'top'

export interface CameraPosition {
  position: [number, number, number]
  target: [number, number, number]
}

// Machine is now centered at origin
const MACHINE_CENTER: [number, number, number] = [0, 1.5, 0]

export const CAMERA_PRESETS: Record<CameraPreset, CameraPosition> = {
  free: {
    position: [10, 8, 10], // Far diagonal view
    target: MACHINE_CENTER,
  },
  isometric: {
    position: [8, 6, 8], // Default isometric view
    target: MACHINE_CENTER,
  },
  front: {
    position: [0, 3, -12], // Looking from front (negative Z, opposite side)
    target: MACHINE_CENTER,
  },
  side: {
    position: [12, 3, 0], // Looking from right side (positive X)
    target: MACHINE_CENTER,
  },
  top: {
    position: [0, 15, 0], // Bird's eye view (directly above)
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
