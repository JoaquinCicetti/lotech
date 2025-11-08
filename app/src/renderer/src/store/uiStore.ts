import { AppMode } from '@renderer/types'
import { create } from 'zustand'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: number
}

export interface UIStore {
  currentMode: AppMode
  showConsole: boolean
  showSettings: boolean
  activeModal: string | null
  notifications: Notification[]

  setMode: (mode: AppMode) => void
  toggleConsole: () => void
  setShowConsole: (show: boolean) => void
  toggleSettings: () => void
  setShowSettings: (show: boolean) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  currentMode: AppMode.MANUAL,
  showConsole: false,
  showSettings: true,
  activeModal: null,
  notifications: [],

  setMode: (currentMode) => set({ currentMode }),

  toggleConsole: () => set((state) => ({ showConsole: !state.showConsole })),
  setShowConsole: (showConsole) => set({ showConsole }),

  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  setShowSettings: (showSettings) => set({ showSettings }),

  openModal: (activeModal) => set({ activeModal }),
  closeModal: () => set({ activeModal: null }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          timestamp: Date.now(),
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}))
