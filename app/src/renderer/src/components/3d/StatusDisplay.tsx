import { Html } from '@react-three/drei'
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

  const progress = (pillCount / targetPills) * 100

  return (
    <Html
      position={[2, 5.5, 0]}
      distanceFactor={10}
      center
      style={{
        width: '300px',
        pointerEvents: 'none',
      }}
    >
      <div className="bg-background/95 border-border rounded-lg border p-4 shadow-xl backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-md font-medium">
              Dispositivo {isConnected ? 'conectado' : 'desconectado'}
            </span>
            <div
              className={`h-3 w-3 rounded-full transition-colors ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              } ${isConnected ? 'shadow-sm shadow-green-500/50' : ''}`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Estado</span>
            <Badge variant="default">{state}</Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>
                {pillCount} / {targetPills}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Peso</span>
            <span className="font-mono text-sm">{(weight ?? 0).toFixed(2)} g</span>
          </div>
        </div>
      </div>
    </Html>
  )
}
