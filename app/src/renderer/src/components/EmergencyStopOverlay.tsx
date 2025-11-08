import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { AlertTriangle, X } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from './ui/button'

export const EmergencyStopOverlay: React.FC = () => {
  const { isEmergencyStopped } = useControllerStateStore()
  const [isDismissed, setIsDismissed] = useState(false)

  // Reset dismissed state when emergency stop becomes active again
  React.useEffect(() => {
    if (isEmergencyStopped) {
      setIsDismissed(false)
    }
  }, [isEmergencyStopped])

  // Don't show if not emergency stopped or if dismissed
  if (!isEmergencyStopped || isDismissed) return null

  const handleDismiss = () => {
    setIsDismissed(true)
  }

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      onClick={handleDismiss}
    >
      <div
        className="animate-in fade-in zoom-in relative rounded-lg border-2 border-red-600 bg-red-950/95 p-8 shadow-2xl duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-red-400 hover:bg-red-900/50 hover:text-red-300"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="h-16 w-16 animate-pulse text-red-500" />
          <h1 className="text-3xl font-bold text-red-500">PARADA DE EMERGENCIA</h1>
          <p className="text-red-300">Todos los motores están detenidos</p>
          <p className="text-sm text-red-400">Desactive la emergencia para continuar</p>
          <p className="mt-2 text-xs text-red-400/70">Click aquí o fuera para ocultar</p>
        </div>
      </div>
    </div>
  )
}
