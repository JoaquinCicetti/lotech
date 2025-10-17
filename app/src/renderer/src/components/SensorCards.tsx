import { ElevatorIndicator } from '@renderer/components/ElevatorIndicator'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { Cpu, Gauge, Move3d } from 'lucide-react'
import React from 'react'

interface SensorIndicatorProps {
  label: string
  active: boolean
}

const SensorIndicator: React.FC<SensorIndicatorProps> = ({ label, active }) => (
  <div
    className={cn(
      'flex items-center justify-between rounded px-2 py-1 text-xs',
      active
        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
        : 'bg-transparent text-gray-500'
    )}
  >
    <span>{label}</span>
    <div className={cn('h-2 w-2 rounded-full', active ? 'bg-lime-500' : 'bg-gray-300')} />
  </div>
)

export const SensorCards: React.FC = () => {
  const { sensorReadings, pillCount, hardwareStatus } = useControllerStateStore()

  return (
    <div className="w-full space-y-4">
      {/* 3 Consolidated Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* 1. Elevator Card with Animation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Move3d className="h-4 w-4" />
              Elevador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ElevatorIndicator />
            <div className="mt-3 space-y-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Proximidad</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {sensorReadings.proximityDistance}/1024
                  </span>
                </div>
                <Progress value={(sensorReadings.proximityDistance / 1024) * 100} className="h-2" />
              </div>
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Sensors Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4" />
              Sensores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Celda de Carga</span>
                <span className="font-mono text-lg font-semibold">
                  {sensorReadings.loadCell.toFixed(3)}g
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Contador de Píldoras</span>
                <span className="font-mono text-lg font-semibold">{pillCount}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1">
                <SensorIndicator label="Peso OK" active={sensorReadings.weightStable} />
                <SensorIndicator label="Frasco" active={sensorReadings.frascoVacio} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Hardware/Outputs Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4" />
              Salidas (Hardware)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <SensorIndicator label="Dosificación" active={hardwareStatus.dosing === 'ACTIVE'} />
              <SensorIndicator label="Molino" active={hardwareStatus.grinder === 'ON'} />
              <SensorIndicator label="Transferencia" active={hardwareStatus.transfer === 'OPEN'} />
              <SensorIndicator label="Tapado" active={hardwareStatus.cap === 'PUSHED'} />
              <SensorIndicator label="Elevador" active={hardwareStatus.elevator !== 'IDLE'} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
