import { Html } from '@react-three/drei'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import React from 'react'

interface FloatingCardsProps {
  /** Position offset to match the machine model */
  modelPosition: [number, number, number]
  /** Scale to match the machine model */
  modelScale: number
}

export const FloatingCards: React.FC<FloatingCardsProps> = (props) => {
  const { modelPosition, modelScale } = props

  const { sensorReadings } = useControllerStateStore()

  // Weight card position - fixed position relative to model center
  const weightCardPos: [number, number, number] = [
    modelPosition[0] + 0.2 * modelScale,
    modelPosition[1] + 0.337 * modelScale,
    modelPosition[2] + 0.06 * modelScale,
  ]

  return (
    <>
      {/* Weight Card */}
      <Html
        position={weightCardPos}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none', zIndex: 10 }}
      >
        <Card className="border-primary/20 bg-background/70 w-36 border-2 shadow-xl backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-muted-foreground font-medium">Peso Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <div className="font-mono text-4xl leading-none font-bold tracking-tight">
                {sensorReadings.loadCell.toFixed(2)}
              </div>
              <span>gramos</span>
            </div>
          </CardContent>
        </Card>
      </Html>
    </>
  )
}
