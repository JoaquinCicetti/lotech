import { Button } from '@renderer/components/ui/button'
import {
  emergencyStop,
  homePosition,
  pauseProduction,
  resetSystem,
  resumeProduction,
  startProduction,
} from '@renderer/serial/serialCommands'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useUIStore } from '@renderer/store/uiStore'
import { AppMode } from '@renderer/types'
import { AlertTriangle, Home, Pause, Play, RefreshCw, RotateCcw } from 'lucide-react'
import React from 'react'
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
  const { isRunning, isPaused, resetState } = useControllerStateStore()

  const handleStart = () => {
    if (isPaused) {
      resumeProduction()
    } else {
      startProduction()
    }
  }

  const handleReset = () => {
    resetState()
    resetSystem()
  }
  // In auto mode, show full controls
  return (
    <div className="flex gap-2">
      <Button
        size="lg"
        variant={isRunning && !isPaused ? 'secondary' : 'default'}
        onClick={handleStart}
        disabled={isRunning && !isPaused}
        className="min-w-[100px]"
      >
        {isPaused ? (
          <>
            <RotateCcw className="mr-2 h-5 w-5" />
            Reanudar
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Iniciar
          </>
        )}
      </Button>

      <Button
        size="lg"
        variant="secondary"
        onClick={pauseProduction}
        disabled={!isRunning || isPaused}
        className="min-w-[100px]"
      >
        <Pause className="mr-2 h-5 w-5" />
        Pausar
      </Button>

      <Button size="lg" variant="outline" onClick={handleReset} className="min-w-[100px]">
        <RefreshCw className="mr-2 h-5 w-5" />
        Reset
      </Button>

      <div className="bg-border mx-2 w-px" />

      <Button size="lg" variant="destructive" onClick={emergencyStop} className="min-w-[140px]">
        <AlertTriangle className="mr-2 h-5 w-5" />
        Parada de Emergencia
      </Button>
    </div>
  )
}

const ManualController: React.FC = () => {
  const { resetState } = useControllerStateStore()
  const handleHome = () => {
    resetState()
    homePosition()
  }

  const handleReset = () => {
    resetState()
    resetSystem()
  }

  return (
    <div className="bg-background flex gap-2 rounded-lg border p-2 shadow-lg">
      <Button size="lg" variant="outline" onClick={handleHome} className="min-w-[100px]">
        <Home className="mr-2 h-5 w-5" />
        Inicio
      </Button>

      <Button size="lg" variant="outline" onClick={handleReset} className="min-w-[100px]">
        <RefreshCw className="mr-2 h-5 w-5" />
        Reset
      </Button>

      <div className="bg-border mx-2 w-px" />

      <Button size="lg" variant="destructive" onClick={emergencyStop} className="min-w-[140px]">
        <AlertTriangle className="mr-2 h-5 w-5" />
        Parada de Emergencia
      </Button>
    </div>
  )
}
