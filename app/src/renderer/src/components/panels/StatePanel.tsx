import { Badge } from '@renderer/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card'
import { cn } from '@renderer/lib/utils'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { Activity, Cpu, Gauge } from 'lucide-react'
import React from 'react'

export const StatePanel: React.FC = () => {
  const {
    machineState,
    isRunning,
    isPaused,
    error,
    sensorReadings,
    hardwareStatus,
    pillCount,
    lastHeartbeat,
  } = useControllerStateStore()

  const isConnected = Date.now() - lastHeartbeat < 5000

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Machine State
          </CardTitle>
          <CardDescription>Current state and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">State</span>
              <Badge variant="outline" className="font-mono">
                {machineState.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <div className="flex gap-2">
                {isRunning && <Badge className="bg-green-500">Running</Badge>}
                {isPaused && <Badge className="bg-yellow-500">Paused</Badge>}
                {!isRunning && !isPaused && <Badge variant="secondary">Idle</Badge>}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection</span>
              <Badge className={cn(isConnected ? 'bg-green-500' : 'bg-red-500')}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            {error && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error</span>
                <Badge variant="destructive">{error}</Badge>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pill Count</span>
              <span className="font-mono text-lg">{pillCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Sensor Readings
          </CardTitle>
          <CardDescription>Real-time sensor values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Load Cell</span>
              <span className="font-mono">{sensorReadings.loadCell.toFixed(2)} g</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Proximity</span>
              <span className="font-mono">{sensorReadings.proximityDistance} mm</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <SensorIndicator label="Pos Alta" active={sensorReadings.posAlta} />
              <SensorIndicator label="Pos Baja" active={sensorReadings.posBaja} />
              <SensorIndicator label="Weight Stable" active={sensorReadings.weightStable} />
              <SensorIndicator label="Frasco Vacío" active={sensorReadings.frascoVacio} />
              <SensorIndicator label="Pastillas" active={sensorReadings.pastillasCargadas} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Hardware Status
          </CardTitle>
          <CardDescription>Component states</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <HardwareItem label="Elevator" status={hardwareStatus.elevator} />
            <HardwareItem label="Dosing" status={hardwareStatus.dosing} />
            <HardwareItem label="Grinder" status={hardwareStatus.grinder} />
            <HardwareItem label="Transfer" status={hardwareStatus.transfer} />
            <HardwareItem label="Cap" status={hardwareStatus.cap} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface SensorIndicatorProps {
  label: string
  active: boolean
}

const SensorIndicator: React.FC<SensorIndicatorProps> = ({ label, active }) => (
  <div className="flex items-center justify-between rounded border p-2">
    <span className="text-xs">{label}</span>
    <div className={cn('h-3 w-3 rounded-full', active ? 'bg-green-500' : 'bg-gray-300')} />
  </div>
)

interface HardwareItemProps {
  label: string
  status: string
}

const HardwareItem: React.FC<HardwareItemProps> = ({ label, status }) => {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('moving') || lowerStatus.includes('active')) return 'text-yellow-600'
    if (lowerStatus === 'on' || lowerStatus === 'open' || lowerStatus === 'pushed')
      return 'text-green-600'
    if (lowerStatus === 'up' || lowerStatus === 'down') return 'text-blue-600'
    return 'text-gray-600'
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className={cn('font-mono text-sm', getStatusColor(status))}>{status}</span>
    </div>
  )
}
