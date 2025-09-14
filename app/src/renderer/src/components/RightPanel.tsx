import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { cn } from '@renderer/lib/utils'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { Cpu, Gauge, Terminal } from 'lucide-react'
import React from 'react'

interface SensorIndicatorProps {
  label: string
  active: boolean
}

const SensorIndicator: React.FC<SensorIndicatorProps> = ({ label, active }) => (
  <div
    className={cn(
      'flex items-center justify-between rounded px-2 py-1 text-xs',
      active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    )}
  >
    <span>{label}</span>
    <div className={cn('h-2 w-2 rounded-full', active ? 'bg-green-500' : 'bg-gray-300')} />
  </div>
)

export const RightPanel: React.FC = () => {
  const { sensorReadings, hardwareStatus, pillCount } = useControllerStateStore()
  const { serialData } = useConnectionStore()

  return (
    <div className="flex h-full flex-col space-y-4 p-4">
      {/* Sensor Readings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Gauge className="h-4 w-4" />
            Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>Load Cell</span>
              <span className="font-mono">{sensorReadings.loadCell.toFixed(1)}g</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Proximity</span>
              <span className="font-mono">{sensorReadings.proximityDistance}mm</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Pill Count</span>
              <span className="font-mono">{pillCount}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1">
              <SensorIndicator label="Pos Alta" active={sensorReadings.posAlta} />
              <SensorIndicator label="Pos Baja" active={sensorReadings.posBaja} />
              <SensorIndicator label="Weight OK" active={sensorReadings.weightStable} />
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
            <SensorIndicator
              label="Elevator"
              active={hardwareStatus.elevator !== 'IDLE' && hardwareStatus.elevator !== 'MIDDLE'}
            />
            <SensorIndicator label="Dosing" active={hardwareStatus.dosing === 'ACTIVE'} />
            <SensorIndicator label="Grinder" active={hardwareStatus.grinder === 'ON'} />
            <SensorIndicator label="Transfer" active={hardwareStatus.transfer === 'CLOSED'} />
            <SensorIndicator label="Cap" active={hardwareStatus.cap === 'PUSHED'} />
            <SensorIndicator label="Load Cell" active={true} />
          </div>
        </CardContent>
      </Card>

      {/* Console - Takes remaining space */}
      <Card className="flex-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4" />
            Console
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)] p-0">
          <ScrollArea className="h-full px-4">
            <div className="space-y-0.5 py-2 font-mono text-xs">
              {serialData.slice(-100).map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    'break-all whitespace-pre-wrap',
                    line.startsWith('>') && 'text-blue-600',
                    line.startsWith('ERROR') && 'text-red-600',
                    line.startsWith('WARNING') && 'text-yellow-600',
                    line.startsWith('DEBUG') && 'text-gray-500'
                  )}
                >
                  {line}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
