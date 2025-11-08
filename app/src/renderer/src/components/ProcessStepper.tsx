import { Download, FileText } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PROCESS_STATES } from '../constants/states'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { usePillTrackingStore } from '@renderer/store/pillTrackingStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { Button } from './ui/button'
import { Progress } from './ui/progress'

export const ProcessStepper: React.FC = () => {
  const { machineState, pillCount, stateProgress } = useControllerStateStore()
  const { dosing } = useSettingsStore()
  const { currentCycle, isTracking, endCycle, exportCycleData } = usePillTrackingStore()

  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    if (!stateProgress) {
      setProgressPercent(0)
      return
    }

    const updateProgress = (): void => {
      const elapsed = Date.now() - stateProgress.startTime
      const percent = Math.min((elapsed / stateProgress.expectedDuration) * 100, 100)
      setProgressPercent(percent)
    }

    updateProgress()
    const interval = setInterval(updateProgress, 100)
    return () => clearInterval(interval)
  }, [stateProgress])

  const getCurrentStateIndex = (): number => {
    return PROCESS_STATES.findIndex((s) => s.id === machineState)
  }

  const currentIndex = getCurrentStateIndex()
  const progressPercentage = (currentIndex / (PROCESS_STATES.length - 1)) * 100

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleExportCycle = async () => {
    if (!currentCycle) {
      toast.error('No hay datos de ciclo para exportar')
      return
    }

    const csvContent = exportCycleData(currentCycle)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `lotech_${currentCycle.lotNumber}_${timestamp}.csv`

    try {
      const result = await window.file.saveDialog({
        content: csvContent,
        defaultFilename: filename,
      })

      if (result.success) {
        toast.success(`Datos del ciclo guardados en ${result.path}`)
      } else if (!result.canceled) {
        toast.error('Error al guardar el archivo')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar datos del ciclo')
    }
  }

  const handleEndCycle = async () => {
    const completedCycle = endCycle()
    if (completedCycle) {
      const csvContent = exportCycleData(completedCycle)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `lotech_${completedCycle.lotNumber}_${timestamp}.csv`

      try {
        const result = await window.file.saveDialog({
          content: csvContent,
          defaultFilename: filename,
        })

        if (result.success) {
          toast.success(`Ciclo finalizado y datos guardados en ${result.path}`)
        } else {
          toast.warning('Ciclo finalizado pero los datos no se guardaron')
        }
      } catch (error) {
        console.error('Export error:', error)
        toast.error('Ciclo finalizado pero fallo al guardar datos')
      }
    }
  }

  return (
    <div className="space-y-4 p-8">
      <div className="relative flex justify-between">
        {/* Progress Line Background */}
        <div className="bg-muted absolute top-6 right-10 left-10 z-0 h-0.5" />

        {/* Progress Line Active */}
        <div
          className="from-primary to-primary/80 absolute top-6 left-10 z-0 h-0.5 bg-gradient-to-r transition-all duration-500"
          style={{
            width: `${progressPercentage * 0.92}%`,
          }}
        />

        {/* State Steps */}
        {PROCESS_STATES.map((state, index) => {
          const isActive = state.id === machineState
          const isPast = index < currentIndex

          return (
            <div key={state.id} className="z-10 flex flex-col items-center gap-2 px-2">
              <div className="relative h-12 w-12">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                    isActive
                      ? 'from-primary to-primary/80 shadow-primary/30 scale-125 bg-gradient-to-br text-black shadow-lg'
                      : isPast
                        ? 'bg-primary text-black'
                        : 'bg-muted text-white'
                  } `}
                >
                  {state.icon}
                </div>
                {isActive && stateProgress && (
                  <svg
                    className="absolute -top-1.5 -left-1.5 h-15 w-15 -rotate-90"
                    style={{
                      width: 60,
                      height: 60,
                    }}
                  >
                    <circle
                      cx="30"
                      cy="30"
                      r="27"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="2"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r="27"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 27}`}
                      strokeDashoffset={`${2 * Math.PI * 27 * (1 - progressPercent / 100)}`}
                      className="transition-all duration-100"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-xs ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground font-normal'} `}
              >
                {state.name}
              </span>
            </div>
          )
        })}
      </div>

      {/* Pill Counter and Cycle Info */}
      <div className="space-y-4 py-5">
        {/* Lot Number if tracking */}
        {isTracking && currentCycle && (
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Lote Activo</div>
            <div className="text-primary text-lg font-semibold">{currentCycle.lotNumber}</div>
          </div>
        )}

        {/* Pill Counter */}
        <div className="text-center">
          <div className="text-muted-foreground mb-2 text-sm">Progreso del lote</div>
          <div className="text-5xl font-light">
            {pillCount} <span className="text-muted-foreground">/ {dosing.lotSize}</span>
          </div>
          <div className="mt-4">
            <Progress value={(pillCount / dosing.lotSize) * 100} className="h-1" />
          </div>
        </div>

        {/* Cycle Duration if tracking */}
        {isTracking && currentCycle && (
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Duración</div>
            <div className="font-mono text-2xl">{formatDuration(currentCycle.startTime)}</div>
          </div>
        )}

        {/* Cycle Actions - Only if tracking */}
        {isTracking && currentCycle && (
          <div className="flex justify-center gap-2 pt-2">
            <Button onClick={handleExportCycle} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Button onClick={handleEndCycle} variant="destructive" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              Finalizar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
