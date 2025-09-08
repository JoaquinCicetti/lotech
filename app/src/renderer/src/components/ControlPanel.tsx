import { Play, RotateCcw } from 'lucide-react'
import React from 'react'
import { SystemStatus } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Label } from './ui/label'
import { Switch } from './ui/switch'

interface ControlPanelProps {
  systemStatus: SystemStatus
  simulationMode: boolean
  onSendCommand: (cmd: string) => void
  onToggleSensor: (sensor: string, value: boolean) => void
  onUpdateStatus: (status: Partial<SystemStatus>) => void
}

interface SensorSwitchProps {
  label: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
}

const SensorSwitch: React.FC<SensorSwitchProps> = (props) => {
  const { label, checked, onChange, disabled = false } = props

  return (
    <div className="flex items-center justify-between py-2">
      <Label htmlFor={label} className="text-sm font-normal">
        {label}
      </Label>
      <Switch id={label} checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}

export const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const { systemStatus, simulationMode, onSendCommand, onToggleSensor, onUpdateStatus } = props

  const handleSensorToggle = (key: keyof SystemStatus['sensors'], sensor: string): void => {
    const newValue = !systemStatus.sensors[key]

    // Prevent both positions being active at the same time
    if (key === 'posAlta' && newValue && systemStatus.sensors.posBaja) {
      onToggleSensor('POS_BAJA', false)
      onUpdateStatus({
        sensors: {
          ...systemStatus.sensors,
          posBaja: false,
        },
      })
    } else if (key === 'posBaja' && newValue && systemStatus.sensors.posAlta) {
      onToggleSensor('POS_ALTA', false)
      onUpdateStatus({
        sensors: {
          ...systemStatus.sensors,
          posAlta: false,
        },
      })
    } else {
      onUpdateStatus({
        sensors: {
          ...systemStatus.sensors,
          [key]: newValue,
        },
      })
    }

    onToggleSensor(sensor, newValue)
  }

  const isStartEnabled = systemStatus.sensors.pastillasCargadas && systemStatus.sensors.frascoVacio

  return (
    <div className="mb-8 grid grid-cols-3 gap-5">
      {/* Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-muted-foreground text-sm font-medium">ACCIONES</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={() => onSendCommand('BTN:START')}
              disabled={!isStartEnabled}
              className="flex-1 gap-2"
              variant={isStartEnabled ? 'default' : 'secondary'}
            >
              <Play className="h-4 w-4" />
              INICIO
            </Button>
            <Button
              onClick={() => onSendCommand('BTN:RESET')}
              variant="outline"
              className="flex-1 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              RESET
            </Button>
          </div>
          {simulationMode && (
            <Button
              onClick={() => onSendCommand('RESET:ALL')}
              variant="destructive"
              className="w-full gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              REINICIAR TODO
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Sensors */}
      <Card className={simulationMode ? '' : 'pointer-events-none opacity-50'}>
        <CardHeader className="pb-4">
          <CardTitle className="text-muted-foreground text-sm font-medium">SENSORES</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SensorSwitch
            label="Posición Alta"
            checked={systemStatus.sensors.posAlta}
            onChange={() => handleSensorToggle('posAlta', 'POS_ALTA')}
          />
          <SensorSwitch
            label="Posición Baja"
            checked={systemStatus.sensors.posBaja}
            onChange={() => handleSensorToggle('posBaja', 'POS_BAJA')}
          />
          <SensorSwitch
            label="Peso Estable"
            checked={systemStatus.sensors.weightStable}
            onChange={() => handleSensorToggle('weightStable', 'WEIGHT_STABLE')}
          />
        </CardContent>
      </Card>

      {/* Pre-conditions */}
      <Card className={simulationMode ? '' : 'pointer-events-none opacity-50'}>
        <CardHeader className="pb-4">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            PRE-CONDICIONES
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <SensorSwitch
            label="Frasco Vacío"
            checked={systemStatus.sensors.frascoVacio}
            onChange={() => handleSensorToggle('frascoVacio', 'FRASCO_VACIO')}
          />
          <SensorSwitch
            label="Pastillas Cargadas"
            checked={systemStatus.sensors.pastillasCargadas}
            onChange={() => handleSensorToggle('pastillasCargadas', 'PASTILLAS_CARGADAS')}
          />
          {!isStartEnabled && (
            <Badge variant="secondary" className="mt-2 text-xs">
              Activar para iniciar
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
