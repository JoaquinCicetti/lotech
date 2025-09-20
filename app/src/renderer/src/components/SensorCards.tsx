import { ElevatorIndicator } from '@renderer/components/ElevatorIndicator'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Progress } from '@renderer/components/ui/progress'
import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { Activity, Cpu, Gauge, Move3d, Scale } from 'lucide-react'
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

interface SensorCardProps {
  title: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  className?: string
}

const SensorCard: React.FC<SensorCardProps> = ({ title, value, unit, icon, className }) => (
  <Card className={cn('', className)}>
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-muted-foreground ml-1 text-base font-normal">{unit}</span>}
      </div>
    </CardContent>
  </Card>
)

export const SensorCards: React.FC = () => {
  const { sensorReadings, pillCount, hardwareStatus } = useControllerStateStore()

  return (
    <div className="w-full space-y-4">
      {/* Main Sensor Values */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <SensorCard
          title="Celda de Carga"
          value={sensorReadings.loadCell.toFixed(1)}
          unit="g"
          icon={<Scale className="h-4 w-4" />}
        />
        <SensorCard
          title="Píldoras"
          value={pillCount}
          unit="pills"
          icon={<Activity className="h-4 w-4" />}
        />

        {/* Elevator Card with visual indicator */}
        <Card className="md:row-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Move3d className="h-4 w-4" />
              Elevador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ElevatorIndicator />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4" />
              Sensores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Celda de Carga</span>
                <span className="font-mono">{sensorReadings.loadCell.toFixed(1)}g</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Proximidad</span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {sensorReadings.proximityDistance}/1024
                  </span>
                </div>
                <Progress value={(sensorReadings.proximityDistance / 1024) * 100} className="h-2" />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Contador de Píldoras</span>
                <span className="font-mono">{pillCount}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-1">
                <SensorIndicator label="Peso OK" active={sensorReadings.weightStable} />
                <SensorIndicator label="Frasco" active={sensorReadings.frascoVacio} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hardware Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cpu className="h-4 w-4" />
              Hardware
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-1">
              <SensorIndicator label="Dosificación" active={hardwareStatus.dosing === 'ACTIVE'} />
              <SensorIndicator label="Molino" active={hardwareStatus.grinder === 'ON'} />
              <SensorIndicator label="Transferencia" active={hardwareStatus.transfer === 'OPEN'} />
              <SensorIndicator label="Tapado" active={hardwareStatus.cap === 'PUSHED'} />
              <SensorIndicator label="Celda de Carga" active={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
