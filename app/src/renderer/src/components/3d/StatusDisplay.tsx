import React from 'react'
import { Html } from '@react-three/drei'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

interface StatusDisplayProps {
  state: string
  pillCount: number
  targetPills: number
  weight: number | undefined
}

export const StatusDisplay: React.FC<StatusDisplayProps> = (props) => {
  const { state, pillCount, targetPills, weight } = props
  
  const progress = (pillCount / targetPills) * 100
  
  return (
    <Html
      position={[0, 4, 0]}
      center
      distanceFactor={10}
      style={{
        width: '300px',
        pointerEvents: 'none'
      }}
    >
      <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 shadow-xl border border-border">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado</span>
            <Badge variant="default">{state}</Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progreso</span>
              <span>{pillCount} / {targetPills}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Peso</span>
            <span className="text-sm font-mono">{(weight ?? 0).toFixed(2)} g</span>
          </div>
        </div>
      </div>
    </Html>
  )
}