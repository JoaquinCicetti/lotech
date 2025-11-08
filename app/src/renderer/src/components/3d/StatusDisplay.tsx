import { Html } from '@react-three/drei'
import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import React from 'react'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

interface StatusDisplayProps {
  isConnected?: boolean
  state: string
  pillCount: number
  targetPills: number
  weight: number | undefined
}

export const StatusDisplay: React.FC<StatusDisplayProps> = (props) => {
  const { state, pillCount, targetPills, weight, isConnected } = props
  const { sensorReadings, hardwareStatus } = useControllerStateStore()

  const progress = (pillCount / targetPills) * 100

  return (
    <Html
      position={[-3, 6, 0]}
      distanceFactor={10}
      center
      style={{
        width: '350px',
        pointerEvents: 'none',
      }}
    >
      <div className="bg-background/95 border-border rounded-lg border p-4 shadow-2xl backdrop-blur-sm">
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between border-b pb-2">
            <span className="text-sm font-semibold">Estado del Sistema</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
              <div
                className={cn(
                  'h-2 w-2 rounded-full transition-all',
                  isConnected ? 'bg-green-500 shadow-sm shadow-green-500/50' : 'bg-red-500'
                )}
              />
            </div>
          </div>

          {/* Machine State */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-xs">Estado</span>
            <Badge variant="default" className="text-xs">
              {state}
            </Badge>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-mono">
                {pillCount} / {targetPills}
              </span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>

          {/* Sensor Readings Grid */}
          <div className="grid grid-cols-2 gap-2 border-t pt-2">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Peso</span>
              <div className="font-mono text-sm font-semibold">{(weight ?? 0).toFixed(4)}g</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Proximidad</span>
              <div className="font-mono text-sm font-semibold">
                {sensorReadings.proximityDistance}
              </div>
            </div>
          </div>

          {/* Hardware Status Indicators */}
          <div className="flex gap-1 border-t pt-2">
            <div
              className={cn(
                'flex-1 rounded px-1 py-0.5 text-center text-xs',
                hardwareStatus.elevator !== 'IDLE'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}
            >
              Elev
            </div>
            <div
              className={cn(
                'flex-1 rounded px-1 py-0.5 text-center text-xs',
                hardwareStatus.dosing === 'ACTIVE'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}
            >
              Dos
            </div>
            <div
              className={cn(
                'flex-1 rounded px-1 py-0.5 text-center text-xs',
                hardwareStatus.grinder === 'ON'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}
            >
              Mol
            </div>
            <div
              className={cn(
                'flex-1 rounded px-1 py-0.5 text-center text-xs',
                hardwareStatus.transfer === 'OPEN'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}
            >
              Trans
            </div>
            <div
              className={cn(
                'flex-1 rounded px-1 py-0.5 text-center text-xs',
                hardwareStatus.cap === 'PUSHED'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
              )}
            >
              Tapa
            </div>
          </div>

          {/* Position Indicators */}
          <div className="flex gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  sensorReadings.posAlta ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
              <span className="text-muted-foreground">Alta</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  sensorReadings.posBaja ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
              <span className="text-muted-foreground">Baja</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  sensorReadings.frascoVacio ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
              <span className="text-muted-foreground">Frasco</span>
            </div>
          </div>
        </div>
      </div>
    </Html>
  )
}
