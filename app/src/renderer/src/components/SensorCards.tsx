import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { Activity, Gauge, Scale, Target } from 'lucide-react'
import React from 'react'

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
        {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
      </div>
    </CardContent>
  </Card>
)

interface SensorIndicatorProps {
  label: string
  active: boolean
}

const SensorIndicator: React.FC<SensorIndicatorProps> = ({ label, active }) => (
  <div
    className={cn(
      'flex items-center justify-between rounded px-3 py-1.5 text-xs',
      active ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    )}
  >
    <span>{label}</span>
    <div className={cn('h-2 w-2 rounded-full', active ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600')} />
  </div>
)

export const SensorCards: React.FC = () => {
  const { sensorReadings, pillCount } = useControllerStateStore()

  return (
    <div className="w-full space-y-4">
      {/* Main Sensor Values */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SensorCard
          title="Celda de Carga"
          value={sensorReadings.loadCell.toFixed(1)}
          unit="g"
          icon={<Scale className="h-4 w-4" />}
        />
        <SensorCard
          title="Proximidad"
          value={sensorReadings.proximityDistance}
          unit=""
          icon={<Target className="h-4 w-4" />}
        />
        <SensorCard
          title="Píldoras"
          value={pillCount}
          unit="pills"
          icon={<Activity className="h-4 w-4" />}
        />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Gauge className="h-4 w-4" />
              Estado Sensores
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1">
            <div className="grid grid-cols-2 gap-1">
              <SensorIndicator label="Alta" active={sensorReadings.posAlta} />
              <SensorIndicator label="Baja" active={sensorReadings.posBaja} />
              <SensorIndicator label="Peso" active={sensorReadings.weightStable} />
              <SensorIndicator label="Frasco" active={sensorReadings.frascoVacio} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}