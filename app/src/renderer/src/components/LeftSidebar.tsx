import { useAppStore } from '@renderer/store/appStore'
import { Boxes, ChevronDown, ChevronUp, Pause, Power, Scale, Square, View } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Label } from './ui/label'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Slider } from './ui/slider'

interface LeftSidebarProps {
  onDisconnect: () => void
  onSendCommand: (command: string) => void
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
  const { onDisconnect, onSendCommand } = props

  // Get all settings from the store
  const {
    simulationMode,
    currentDelays,
    currentDosing,
    setSimulationMode,
    setCurrentDelays,
    setCurrentDosing,
  } = useAppStore()

  const [wheelDivisions, setWheelDivisions] = useState(currentDosing.wheelDivisions)
  const [lotSize, setLotSize] = useState(currentDosing.lotSize)
  const [delays, setDelays] = useState(currentDelays)

  // Sync with store changes
  useEffect(() => {
    setDelays(currentDelays)
  }, [currentDelays])

  useEffect(() => {
    setWheelDivisions(currentDosing.wheelDivisions)
    setLotSize(currentDosing.lotSize)
  }, [currentDosing])

  const handleDelayChange = (key: keyof typeof delays, value: number) => {
    const newDelays = { ...delays, [key]: value }
    setDelays(newDelays)
    // Auto-save to store and localStorage
    setCurrentDelays(newDelays)
    localStorage.setItem('delaySettings', JSON.stringify(newDelays))
    // Send to controller
    const cmd = `SET:DELAYS:SETTLE:${newDelays.settle},WEIGHT:${newDelays.weight},TRANSFER:${newDelays.transfer},GRIND:${newDelays.grind},CAP:${newDelays.cap},UP:${newDelays.elevUp},DOWN:${newDelays.elevDown}`
    onSendCommand(cmd)
  }

  const handleDosingChange = (wheelDiv: number, lot: number) => {
    const newDosing = { wheelDivisions: wheelDiv, lotSize: lot }
    setCurrentDosing(newDosing)
    localStorage.setItem('dosingSettings', JSON.stringify(newDosing))
    onSendCommand(`SET:DIVISIONS:${wheelDiv}`)
    onSendCommand(`SET:LOT_SIZE:${lot}`)
  }

  return (
    <div className="bg-card border-border flex h-full flex-col border-r">
      {/* Header */}
      <div className="border-border space-y-3 border-b p-4">
        <h2 className="text-lg font-semibold">Control Panel</h2>
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
                    handleDosingChange(v, lotSize)
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
                    handleDosingChange(wheelDivisions, v)
                  }}
                  min={1}
                  max={Math.min(50, wheelDivisions)}
                  step={1}
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
                min={50}
                max={15_000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('settle', v)}
              />

              <DelayControl
                label="Peso"
                value={delays.weight}
                min={50}
                max={15_000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('weight', v)}
              />

              <DelayControl
                label="Transferencia"
                value={delays.transfer}
                min={50}
                max={15_000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('transfer', v)}
              />

              <DelayControl
                label="Molienda"
                value={delays.grind}
                min={100}
                max={15_000}
                step={500}
                unit="ms"
                onChange={(v) => handleDelayChange('grind', v)}
              />

              <DelayControl
                label="Tapado"
                value={delays.cap}
                min={50}
                max={15_000}
                step={100}
                unit="ms"
                onChange={(v) => handleDelayChange('cap', v)}
              />

              <DelayControl
                label="Elevador Arriba"
                value={delays.elevUp}
                min={100}
                max={15_000}
                step={500}
                unit="ms"
                onChange={(v) => handleDelayChange('elevUp', v)}
              />

              <DelayControl
                label="Elevador Abajo"
                value={delays.elevDown}
                min={100}
                max={15_000}
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
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">Modo</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => {
                setSimulationMode(false)
                onSendCommand('MODE:REAL')
              }}
              variant={simulationMode ? 'secondary' : 'default'}
              size="default"
              className="gap-2 font-medium"
            >
              <View className="h-4 w-4" />
              Real
            </Button>
            <Button
              onClick={() => {
                setSimulationMode(true)
                onSendCommand('MODE:SIM')
              }}
              variant={simulationMode ? 'default' : 'secondary'}
              size="default"
              className="gap-2 font-medium"
            >
              <Boxes className="h-4 w-4" />
              Simulacion
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
