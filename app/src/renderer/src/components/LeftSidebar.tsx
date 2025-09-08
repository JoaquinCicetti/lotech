import {
  Boxes,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  Power,
  RotateCcw,
  Scale,
  Square,
  View,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Slider } from './ui/slider'
import { Switch } from './ui/switch'

interface LeftSidebarProps {
  currentView: '3d' | 'dashboard'
  onViewChange: (view: '3d' | 'dashboard') => void
  simulationMode: boolean
  onSimulationModeChange: (mode: boolean) => void
  onDisconnect: () => void
  onSendCommand: (command: string) => void
  currentDelays?: {
    settle: number
    weight: number
    transfer: number
    grind: number
    cap: number
    elevUp: number
    elevDown: number
  }
  currentDosing?: {
    wheelDivisions: number
    lotSize: number
  }
  onSaveSettings?: (delays: any, dosing: any) => void
}

interface DelayControlProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}

const DelayControl: React.FC<DelayControlProps> = (props) => {
  const { label, value, min, max, step, unit, onChange } = props

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-muted-foreground font-mono text-xs">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  )
}

export const LeftSidebar: React.FC<LeftSidebarProps> = (props) => {
  const {
    currentView,
    onViewChange,
    simulationMode,
    onSimulationModeChange,
    onDisconnect,
    onSendCommand,
    currentDelays,
    currentDosing,
    onSaveSettings,
  } = props

  const [targetPills, setTargetPills] = useState(20)
  const [wheelDivisions, setWheelDivisions] = useState(currentDosing?.wheelDivisions || 20)
  const [lotSize, setLotSize] = useState(currentDosing?.lotSize || 10)

  const [delays, setDelays] = useState({
    settle: currentDelays?.settle || 1500,
    weight: currentDelays?.weight || 2000,
    transfer: currentDelays?.transfer || 1200,
    grind: currentDelays?.grind || 5000,
    cap: currentDelays?.cap || 2500,
    elevUp: currentDelays?.elevUp || 4000,
    elevDown: currentDelays?.elevDown || 4000,
  })

  useEffect(() => {
    if (currentDelays) {
      setDelays(currentDelays)
    }
  }, [currentDelays])

  useEffect(() => {
    if (currentDosing) {
      setWheelDivisions(currentDosing.wheelDivisions)
      setLotSize(currentDosing.lotSize)
    }
  }, [currentDosing])

  const handleDelayChange = (key: keyof typeof delays, value: number) => {
    const newDelays = { ...delays, [key]: value }
    setDelays(newDelays)
    // Auto-save on change
    onSaveSettings?.(newDelays, { wheelDivisions, lotSize })
  }

  const handleTargetPillsChange = (value: number) => {
    setTargetPills(value)
    onSendCommand(`SET:TARGET:${value}`)
  }

  return (
    <div className="bg-card border-border flex h-full flex-col border-r">
      {/* Header */}
      <div className="border-border space-y-3 border-b p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Control Panel</h2>
          <Switch
            id="simulation"
            checked={simulationMode}
            onCheckedChange={(checked) => {
              onSimulationModeChange(checked)
              onSendCommand(checked ? 'MODE:SIM' : 'MODE:REAL')
            }}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => onSendCommand('BTN:START')}
            size="sm"
            variant="default"
            className="flex-1 gap-1"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
          <Button
            onClick={() => onSendCommand('BTN:RESET')}
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
        <Button
          onClick={() => onSendCommand('RESET:ALL')}
          variant="destructive"
          className="w-full gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          REINICIAR TODO
        </Button>
      </div>

      {/* Scrollable Settings */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-4">
          {/* Command Tools */}
          <Card className="p-4">
            <Label className="mb-3 block text-sm font-medium">Comandos</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onSendCommand('BTN:PAUSE')}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Pause className="h-3 w-3" />
                Pausar
              </Button>
              <Button
                onClick={() => onSendCommand('BTN:STOP')}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Square className="h-3 w-3" />
                Detener
              </Button>
              <Button
                onClick={() => onSendCommand('TARE')}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Scale className="h-3 w-3" />
                Tara
              </Button>
              <Button
                onClick={() => onSendCommand('SIM:WEIGHT_STABLE:1')}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Scale className="h-3 w-3" />
                Estabilizar
              </Button>
              <Button
                onClick={() => onSendCommand('ELEV:UP')}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <ChevronUp className="h-3 w-3" />
                Subir
              </Button>
              <Button
                onClick={() => onSendCommand('ELEV:DOWN')}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <ChevronDown className="h-3 w-3" />
                Bajar
              </Button>
            </div>
          </Card>

          {/* Target Pills */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cantidad de Pastillas</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={targetPills}
                  onChange={(e) => handleTargetPillsChange(Number(e.target.value))}
                  className="h-9 w-20 text-center font-mono"
                  min={1}
                  max={100}
                />
                <Slider
                  value={[targetPills]}
                  onValueChange={([v]) => handleTargetPillsChange(v)}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
          </Card>

          {/* Dosing Settings */}
          <Card className="p-4">
            <Label className="mb-3 block text-sm font-medium">Dosificación</Label>
            <div className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">Divisiones de Rueda</Label>
                  <span className="text-muted-foreground font-mono text-xs">{wheelDivisions}</span>
                </div>
                <Slider
                  value={[wheelDivisions]}
                  onValueChange={([v]) => {
                    setWheelDivisions(v)
                    onSaveSettings?.(delays, { wheelDivisions: v, lotSize })
                  }}
                  min={10}
                  max={50}
                  step={1}
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-xs">Tamaño del Lote</Label>
                  <span className="text-muted-foreground font-mono text-xs">{lotSize}</span>
                </div>
                <Slider
                  value={[lotSize]}
                  onValueChange={([v]) => {
                    setLotSize(v)
                    onSaveSettings?.(delays, { wheelDivisions, lotSize: v })
                  }}
                  min={5}
                  max={50}
                  step={5}
                />
              </div>
            </div>
          </Card>

          {/* Timing Settings */}
          <Card className="p-4">
            <Label className="mb-4 block text-sm font-medium">Tiempos de Proceso</Label>
            <div className="space-y-4">
              <DelayControl
                label="Asentamiento"
                value={delays.settle}
                min={500}
                max={5000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('settle', v)}
              />

              <DelayControl
                label="Peso"
                value={delays.weight}
                min={500}
                max={5000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('weight', v)}
              />

              <DelayControl
                label="Transferencia"
                value={delays.transfer}
                min={500}
                max={3000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('transfer', v)}
              />

              <DelayControl
                label="Molienda"
                value={delays.grind}
                min={1000}
                max={10000}
                step={500}
                unit="ms"
                onChange={(v) => handleDelayChange('grind', v)}
              />

              <DelayControl
                label="Tapado"
                value={delays.cap}
                min={500}
                max={5000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('cap', v)}
              />

              <DelayControl
                label="Elevador Arriba"
                value={delays.elevUp}
                min={1000}
                max={8000}
                step={500}
                unit="ms"
                onChange={(v) => handleDelayChange('elevUp', v)}
              />

              <DelayControl
                label="Elevador Abajo"
                value={delays.elevDown}
                min={1000}
                max={8000}
                step={500}
                unit="ms"
                onChange={(v) => handleDelayChange('elevDown', v)}
              />
            </div>
          </Card>
        </div>
      </ScrollArea>

      <Separator />

      {/* Footer with View Switcher and Disconnect */}
      <div className="bg-muted/50 space-y-3 p-4">
        {/* View Switcher - More prominent */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Vista Actual</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => onViewChange('dashboard')}
              variant={currentView === 'dashboard' ? 'default' : 'secondary'}
              size="default"
              className="gap-2 font-medium"
            >
              <View className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => onViewChange('3d')}
              variant={currentView === '3d' ? 'default' : 'secondary'}
              size="default"
              className="gap-2 font-medium"
            >
              <Boxes className="h-4 w-4" />
              Vista 3D
            </Button>
          </div>
        </div>

        <Button onClick={onDisconnect} variant="destructive" size="sm" className="w-full gap-2">
          <Power className="h-4 w-4" />
          Desconectar
        </Button>
      </div>
    </div>
  )
}
