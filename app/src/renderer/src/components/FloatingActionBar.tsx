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
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform gap-2 rounded-lg border bg-black/30 p-2 shadow-lg backdrop-blur-md">
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
  const { startNewCycle, isTracking, currentCycle, endCycle } = usePillTrackingStore()
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

  // Simplified AUTO mode controls
  return (
    <>
      <LotNumberDialog
        open={showLotDialog}
        onOpenChange={setShowLotDialog}
        onConfirm={handleLotConfirm}
      />
      <div className="flex gap-2">
        {/* Single Play/Pause Button */}
        <Button
          size="lg"
          variant={isRunning && !isPaused ? 'default' : 'secondary'}
          onClick={handlePlayPauseToggle}
          disabled={isEmergencyStopped}
          className="min-w-[120px]"
        >
          {!isRunning ? (
            <>
              <Play className="mr-2 h-5 w-5" />
              Iniciar
            </>
          ) : isPaused ? (
            <>
              <Play className="mr-2 h-5 w-5" />
              Reanudar
            </>
          ) : (
            <>
              <Pause className="mr-2 h-5 w-5" />
              Pausar
            </>
          )}
        </Button>

        <div className="bg-border mx-2 w-px" />

        {/* Emergency Button */}
        <Button
          size="lg"
          variant={isEmergencyStopped ? 'destructive' : 'outline'}
          onClick={handleEmergencyToggle}
          disabled={isEmergencyStopped}
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          Emergencia
        </Button>

        {/* Reset Button - Only show when emergency is/was activated */}
        {isEmergencyStopped && (
          <Button size="lg" variant="secondary" onClick={handleReset}>
            <RefreshCw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        )}
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
    <div className="flex gap-2">
      {/* Reset Button - Only show when emergency is/was activated */}

      <Button
        size="lg"
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
        className="flex-1 gap-2"
        title={
          physicalRestrictions
            ? 'Safety restrictions are ON - motors stop at sensor limits'
            : 'Safety restrictions are OFF - motors can move freely (WARNING!)'
        }
      >
        {physicalRestrictions ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
        {physicalRestrictions ? 'Seguro' : 'Sin restricciones'}
      </Button>

      {isEmergencyStopped && (
        <Button size="lg" variant="secondary" onClick={handleReset}>
          <RefreshCw className="mr-2 h-5 w-5" />
          Reset
        </Button>
      )}

      {/* Emergency Button */}
      <Button
        size="lg"
        variant={'destructive'}
        onClick={handleEmergencyToggle}
        disabled={isEmergencyStopped}
      >
        <AlertTriangle className="mr-2 h-5 w-5" />
        Emergencia
      </Button>
    </div>
  )
}
