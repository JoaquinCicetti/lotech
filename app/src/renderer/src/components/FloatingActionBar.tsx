import {
  emergencyStop,
  homePosition,
  pauseProduction,
  resumeProduction,
  startProduction,
  stopProduction,
} from '@renderer/commands/serialCommands'
import { Button } from '@renderer/components/ui/button'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useUIStore } from '@renderer/store/uiStore'
import { AlertTriangle, Home, Pause, Play, RotateCcw, Square } from 'lucide-react'
import React from 'react'

export const FloatingActionBar: React.FC = () => {
  const { currentMode } = useUIStore()
  const { isRunning, isPaused, resetState } = useControllerStateStore()

  const handleStart = () => {
    if (isPaused) {
      resumeProduction()
    } else {
      startProduction()
    }
  }

  const handleHome = () => {
    resetState()
    homePosition()
  }

  // In manual mode, show only emergency stop and home
  if (currentMode === 'manual') {
    return (
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
        <div className="bg-background flex gap-2 rounded-lg border p-2 shadow-lg">
          <Button size="lg" variant="outline" onClick={handleHome} className="min-w-[100px]">
            <Home className="mr-2 h-5 w-5" />
            Inicio
          </Button>

          <div className="bg-border mx-2 w-px" />

          <Button size="lg" variant="destructive" onClick={emergencyStop} className="min-w-[140px]">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Parada de Emergencia
          </Button>
        </div>
      </div>
    )
  }

  // In auto mode, show full controls
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform">
      <div className="bg-background flex gap-2 rounded-lg border p-2 shadow-lg">
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

        <Button
          size="lg"
          variant="secondary"
          onClick={stopProduction}
          disabled={!isRunning}
          className="min-w-[100px]"
        >
          <Square className="mr-2 h-5 w-5" />
          Detener
        </Button>

        <div className="bg-border mx-2 w-px" />

        <Button size="lg" variant="destructive" onClick={emergencyStop} className="min-w-[140px]">
          <AlertTriangle className="mr-2 h-5 w-5" />
          Parada de Emergencia
        </Button>
      </div>
    </div>
  )
}
