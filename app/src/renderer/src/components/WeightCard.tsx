import { Card, CardContent } from '@renderer/components/ui/card'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { Scale } from 'lucide-react'
import React from 'react'

export const WeightCard: React.FC = () => {
  const currentWeight = useControllerStateStore((state) => state.currentWeight)
  const weightStable = useControllerStateStore((state) => state.sensorReadings.weightStable)

  return (
    <Card className="bg-background/80 shadow-lg backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-lime-500/20 p-2">
            <Scale className="h-5 w-5 text-lime-500" />
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Peso Actual</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tabular-nums">{currentWeight.toFixed(2)}</p>
              <span className="text-muted-foreground text-sm">mg</span>
              {weightStable && (
                <span className="ml-2 rounded-full bg-lime-500/20 px-2 py-0.5 text-xs text-lime-600">
                  Estable
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
