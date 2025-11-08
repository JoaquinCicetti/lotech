import { Button } from '@renderer/components/ui/button'
import {
  disableRestrictions,
  emergencyStop,
  enableRestrictions,
  pauseProduction,
  resetSystem,
  resumeProduction,
  startProduction,
} from '@renderer/serial/serialCommands'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { usePillTrackingStore } from '@renderer/store/pillTrackingStore'
import { useUIStore } from '@renderer/store/uiStore'
import { AppMode } from '@renderer/types'
import { AlertTriangle, Pause, Play, RefreshCw, Shield, ShieldOff } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { LotNumberDialog } from './LotNumberDialog'
import { ProcessStepper } from './ProcessStepper'

export const FloatingActionBar: React.FC = () => {
  const { currentMode } = useUIStore()

  return (
    <div className="bg-background/80 fixed bottom-2 left-1/2 z-50 -translate-x-1/2 transform gap-2 rounded-lg border p-2 shadow-lg backdrop-blur-md">
      <ProcessStepper />
      {currentMode === AppMode.AUTO ? <AutoController /> : <ManualController />}
    </div>
  )
}
const AutoController: React.FC = () => {
  const {
    isRunning,
    isPaused,
    resetState,
    isEmergencyStopped,
    setEmergencyStopped,
    setRunning,
    setPaused,
  } = useControllerStateStore()
  const { startNewCycle, isTracking, currentCycle, endCycle, exportCycleData } =
    usePillTrackingStore()
  const [showLotDialog, setShowLotDialog] = useState(false)

  const handlePlayPauseToggle = () => {
    if (isEmergencyStopped) {
      toast.error('Desactive la emergencia primero')
      return
    }

    if (!isRunning) {
      // Not running - show lot dialog to start
      setShowLotDialog(true)
    } else if (isPaused) {
      // Currently paused - resume
      resumeProduction()
      setPaused(false)
      toast.success('Producción reanudada')
    } else {
      // Currently running - pause
      pauseProduction()
      setPaused(true)
      toast.info('Producción pausada')
    }
  }

  const handleLotConfirm = (lotNumber: string) => {
    console.log('FloatingActionBar - handleLotConfirm called with:', lotNumber)
    // Start tracking with the lot number
    startNewCycle(lotNumber)
    console.log('FloatingActionBar - Sending START command to Arduino')
    // Then start the production
    startProduction()
    // Update running state
    setRunning(true)
    setPaused(false)
    toast.success(`Producción iniciada - Lote: ${lotNumber}`)
  }

  const handleEmergencyToggle = () => {
    if (!isEmergencyStopped) {
      // Activate emergency
      emergencyStop()
      setEmergencyStopped(true)
      setRunning(false)
      setPaused(false)

      // End cycle if tracking
      if (isTracking && currentCycle) {
        endCycle()
      }

      toast.error('EMERGENCIA ACTIVADA', {
        duration: 5000,
        id: 'emergency-stop',
      })
    } else {
      // Can't deactivate from here - need reset
      toast.info('Use Reset para desactivar emergencia')
    }
  }

  const handleReset = () => {
    resetSystem()
    resetState()
    setEmergencyStopped(false)
    toast.success('Sistema reiniciado')
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

  // Simplified AUTO mode controls
  return (
    <>
      <LotNumberDialog
        open={showLotDialog}
        onOpenChange={setShowLotDialog}
        onConfirm={handleLotConfirm}
      />
      <div className="flex gap-4">
        <>
          {/* Single Play/Pause Button */}
          <Button
            variant={isRunning && !isPaused ? 'default' : 'secondary'}
            onClick={handlePlayPauseToggle}
            disabled={isEmergencyStopped}
            className="min-w-[100px]"
          >
            {!isRunning ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Iniciar
              </>
            ) : isPaused ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                Reanudar
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </>
            )}
          </Button>

          {/* Reset Button - Only show when emergency is/was activated */}
          {isEmergencyStopped && (
            <Button variant="secondary" onClick={handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}

          {/* Emergency Button */}
          <Button
            className="grow-1"
            variant={'destructive'}
            onClick={handleEmergencyToggle}
            disabled={isEmergencyStopped}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Emergencia
          </Button>
        </>
      </div>
    </>
  )
}

const ManualController: React.FC = () => {
  const {
    resetState,
    isEmergencyStopped,
    setEmergencyStopped,
    physicalRestrictions,
    setPhysicalRestrictions,
  } = useControllerStateStore()

  const handleEmergencyToggle = () => {
    if (!isEmergencyStopped) {
      // Activate emergency
      emergencyStop()
      setEmergencyStopped(true)
      toast.error('EMERGENCIA ACTIVADA', {
        duration: 5000,
        id: 'emergency-stop',
      })
    } else {
      // Can't deactivate from here - need reset
      toast.info('Use Reset para desactivar emergencia')
    }
  }

  const handleReset = () => {
    resetSystem()
    resetState()
    setEmergencyStopped(false)
    toast.success('Sistema reiniciado')
  }

  // Simplified MANUAL mode - only Emergency and Reset when needed
  return (
    <div className="flex gap-4">
      {/* Safety Toggle */}
      <Button
        variant={physicalRestrictions ? 'default' : 'destructive'}
        onClick={() => {
          const newState = !physicalRestrictions
          setPhysicalRestrictions(newState) // Update local state immediately
          if (newState) {
            enableRestrictions()
          } else {
            disableRestrictions()
          }
        }}
        className="gap-2"
        title={
          physicalRestrictions
            ? 'Safety restrictions are ON - motors stop at sensor limits'
            : 'Safety restrictions are OFF - motors can move freely (WARNING!)'
        }
      >
        {physicalRestrictions ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
        {physicalRestrictions ? 'Seguro' : 'Sin restricciones'}
      </Button>

      {/* Reset Button - Only show when emergency is/was activated */}
      {isEmergencyStopped && (
        <Button variant="secondary" onClick={handleReset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      )}

      {/* Emergency Button */}
      <Button
        className="grow-1"
        variant={'destructive'}
        onClick={handleEmergencyToggle}
        disabled={isEmergencyStopped}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Emergencia
      </Button>
    </div>
  )
}
