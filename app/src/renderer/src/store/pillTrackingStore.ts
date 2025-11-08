import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'

export interface PillData {
  weight: number
  timestamp: number
  pillNumber: number
}

export interface CycleData {
  lotNumber: string
  startTime: number
  endTime?: number
  pills: PillData[]
  totalPills: number
  averageWeight?: number
  minWeight?: number
  maxWeight?: number
  standardDeviation?: number
}

interface PillTrackingStore {
  // Current cycle data
  currentCycle: CycleData | null
  isTracking: boolean

  // Historical data (optional, for future use)
  completedCycles: CycleData[]

  // Recovery flag
  hasRecoveredData: boolean

  // Actions
  startNewCycle: (lotNumber: string) => void
  recordPillWeight: (weight: number) => void
  endCycle: () => CycleData | null
  clearCurrentCycle: () => void
  exportCycleData: (cycle: CycleData) => string
  recoverFromStorage: () => void

  // Statistics
  calculateStatistics: (pills: PillData[]) => {
    averageWeight: number
    minWeight: number
    maxWeight: number
    standardDeviation: number
  }
}

export const usePillTrackingStore = create<PillTrackingStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      currentCycle: null,
      isTracking: false,
      completedCycles: [],
      hasRecoveredData: false,

      startNewCycle: (lotNumber: string) => {
        set({
          currentCycle: {
            lotNumber,
            startTime: Date.now(),
            pills: [],
            totalPills: 0,
          },
          isTracking: true,
          hasRecoveredData: false,
        })
      },

      recordPillWeight: (weight: number) => {
        const state = get()
        console.log('recordPillWeight called:', {
          weight,
          hasCurrentCycle: !!state.currentCycle,
          isTracking: state.isTracking,
          currentPillsCount: state.currentCycle?.pills.length,
        })

        if (!state.currentCycle || !state.isTracking) {
          console.warn('Cannot record pill: no active cycle or not tracking')
          return
        }

        const newPill: PillData = {
          weight,
          timestamp: Date.now(),
          pillNumber: state.currentCycle.pills.length + 1,
        }

        console.log('Recording pill:', newPill)

        const updatedPills = [...state.currentCycle.pills, newPill]
        const stats = state.calculateStatistics(updatedPills)

        set({
          currentCycle: {
            ...state.currentCycle,
            pills: updatedPills,
            totalPills: updatedPills.length,
            ...stats,
          },
        })

        console.log('Pill recorded successfully. Total pills now:', updatedPills.length)
      },

      endCycle: () => {
        const state = get()
        if (!state.currentCycle) return null

        const completedCycle: CycleData = {
          ...state.currentCycle,
          endTime: Date.now(),
        }

        set({
          currentCycle: null,
          isTracking: false,
          completedCycles: [...state.completedCycles, completedCycle],
        })

        return completedCycle
      },

      clearCurrentCycle: () => {
        set({
          currentCycle: null,
          isTracking: false,
          hasRecoveredData: false,
        })
      },

      recoverFromStorage: () => {
        const state = get()
        if (state.currentCycle && !state.hasRecoveredData) {
          set({ hasRecoveredData: true, isTracking: true })
        }
      },

      calculateStatistics: (pills: PillData[]) => {
        if (pills.length === 0) {
          return {
            averageWeight: 0,
            minWeight: 0,
            maxWeight: 0,
            standardDeviation: 0,
          }
        }

        const weights = pills.map((p) => p.weight)
        const sum = weights.reduce((acc, w) => acc + w, 0)
        const averageWeight = sum / weights.length
        const minWeight = Math.min(...weights)
        const maxWeight = Math.max(...weights)

        // Calculate standard deviation
        const squaredDiffs = weights.map((w) => Math.pow(w - averageWeight, 2))
        const avgSquaredDiff = squaredDiffs.reduce((acc, d) => acc + d, 0) / weights.length
        const standardDeviation = Math.sqrt(avgSquaredDiff)

        return {
          averageWeight,
          minWeight,
          maxWeight,
          standardDeviation,
        }
      },

      exportCycleData: (cycle: CycleData) => {
        const {
          lotNumber,
          startTime,
          endTime,
          pills,
          totalPills,
          averageWeight,
          minWeight,
          maxWeight,
          standardDeviation,
        } = cycle

        // Create CSV format
        let csv = 'Reporte de Procesamiento de Píldoras - Lotech\n'
        csv += `Número de Lote:,${lotNumber}\n`
        csv += `Hora de Inicio:,${new Date(startTime).toLocaleString()}\n`
        csv += `Hora de Fin:,${endTime ? new Date(endTime).toLocaleString() : 'En Progreso'}\n`
        csv += `Total de Píldoras:,${totalPills}\n`
        csv += `Peso Promedio (mg):,${averageWeight?.toFixed(2) || 'N/D'}\n`
        csv += `Peso Mínimo (mg):,${minWeight?.toFixed(2) || 'N/D'}\n`
        csv += `Peso Máximo (mg):,${maxWeight?.toFixed(2) || 'N/D'}\n`
        csv += `Desviación Estándar:,${standardDeviation?.toFixed(2) || 'N/D'}\n`
        csv += '\n'
        csv += 'Píldora #,Peso (mg),Marca de Tiempo\n'

        pills.forEach((pill) => {
          csv += `${pill.pillNumber},${pill.weight.toFixed(4)},${new Date(pill.timestamp).toLocaleString()}\n`
        })

        return csv
      },
    })),
    {
      name: 'pill-tracking-storage', // localStorage key
      partialize: (state) => ({
        currentCycle: state.currentCycle,
        isTracking: state.isTracking,
        completedCycles: state.completedCycles.slice(-10), // Keep only last 10 completed cycles
      }),
    }
  )
)
