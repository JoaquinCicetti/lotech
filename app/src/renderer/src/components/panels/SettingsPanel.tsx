import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import { debounce } from '@renderer/lib/utils'
import {
  dispenseOnePill,
  tareLoadCell,
  testCapPush,
  testCapRetract,
  testDosingForward,
  testDosingStop,
  testElevatorDown,
  testElevatorStop,
  testElevatorUp,
  testGrinderOff,
  testGrinderOn,
  testLoadCell,
  testTransferClose,
  testTransferOpen,
  updateDelays,
  updateDosing,
  updateElevator,
  updateLoadCell,
  updateProximity,
  updateTimeouts,
} from '@renderer/serial/serialCommands'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useUIStore } from '@renderer/store/uiStore'
import {
  DelaySettings,
  DosingSettings,
  ElevatorSettings,
  HardwareTimeouts,
  LoadCellSettings,
  ProximitySettings,
} from '@renderer/types'
import {
  ArrowDown,
  ArrowRightFromLine,
  ArrowsUpFromLine,
  ArrowUp,
  Blend,
  CircleDot,
  Eye,
  LoaderPinwheel,
  Play,
  Power,
  PowerOff,
  RedoDot,
  Scale,
  Square,
} from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'

export const SettingsPanel: React.FC = () => {
  const {
    delays,
    dosing,
    proximity,
    elevator,
    timeouts,
    loadCell,
    updateDelay,
    updateDosing: updateDosingStore,
    updateProximity: updateProximityStore,
    updateElevator: updateElevatorStore,
    updateTimeout,
    updateLoadCell: updateLoadCellStore,
  } = useSettingsStore()

  const { currentMode } = useUIStore()
  const isManualMode = currentMode === 'manual'

  // Create debounced functions with 300ms delay to avoid spamming serial
  const sendDelaysDebounced = debounce((delays: DelaySettings) => {
    updateDelays(delays)
  }, 300)

  const sendDosingDebounced = debounce((dosing: DosingSettings) => {
    updateDosing(dosing.wheelDivisions, dosing.lotSize, dosing.motorSpeed)
  }, 300)

  const sendProximityDebounced = debounce((proximity: ProximitySettings) => {
    updateProximity(proximity.minProximity, proximity.maxProximity)
  }, 300)

  const sendElevatorDebounced = debounce((speed: number) => {
    updateElevator(speed)
  }, 300)

  const sendTimeoutsDebounced = debounce((timeouts: HardwareTimeouts) => {
    updateTimeouts(timeouts)
  }, 300)

  const sendLoadCellDebounced = debounce((loadCell: LoadCellSettings) => {
    updateLoadCell(loadCell.calibrationFactor, loadCell.deadband)
  }, 300)

  const handleDelayChange = (key: keyof DelaySettings, value: number) => {
    const newDelays = { ...delays, [key]: value }
    updateDelay(key, value)
    sendDelaysDebounced(newDelays)
  }

  const handleDosingChange = (key: keyof DosingSettings, value: number) => {
    const newDosing = { ...dosing, [key]: value }
    updateDosingStore(key, value)
    sendDosingDebounced(newDosing)
  }

  const handleProximityChange = (key: keyof ProximitySettings, value: number) => {
    const newProximity = { ...proximity, [key]: value }
    updateProximityStore(key, value)
    sendProximityDebounced(newProximity)
  }

  const handleElevatorChange = (key: keyof ElevatorSettings, value: number) => {
    updateElevatorStore(key, value)
    if (key === 'speed') {
      sendElevatorDebounced(value)
    }
  }

  const handleTimeoutChange = (key: keyof HardwareTimeouts, value: number) => {
    const newTimeouts = { ...timeouts, [key]: value }
    updateTimeout(key, value)
    sendTimeoutsDebounced(newTimeouts)
  }

  const handleLoadCellChange = (key: keyof LoadCellSettings, value: number) => {
    const newLoadCell = { ...loadCell, [key]: value }
    updateLoadCellStore(key, value)
    sendLoadCellDebounced(newLoadCell)
  }

  return (
    <Card className="bg-card/0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Ajustes</CardTitle>
        <CardDescription>Configuración por componente de la máquina</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-12">
          {/* 1. ELEVATOR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Elevador</h3>
              <ArrowsUpFromLine className="h-4 w-4" />
            </div>

            <div className="space-y-3 pt-2">
              {/* Ciclo */}
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground text-xs font-semibold">Ciclo</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo máx. subida:</Label>
                    <span className="text-sm">{delays.elevUp}ms</span>
                  </div>
                  <Slider
                    value={[delays.elevUp]}
                    onValueChange={([v]) => handleDelayChange('elevUp', v)}
                    max={20_000}
                    step={100}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo máx. bajada:</Label>
                    <span className="text-sm">{delays.elevDown}ms</span>
                  </div>
                  <Slider
                    value={[delays.elevDown]}
                    onValueChange={([v]) => handleDelayChange('elevDown', v)}
                    max={20_000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="my-3 border-t" />

              {/* Configuración */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">Configuración</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Posición superior (sensor):</Label>
                    <span className="text-sm">{proximity.maxProximity}mm</span>
                  </div>
                  <Slider
                    value={[proximity.maxProximity]}
                    onValueChange={([v]) => handleProximityChange('maxProximity', v)}
                    min={50}
                    max={120}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Posición inferior (sensor):</Label>
                    <span className="text-sm">{proximity.minProximity}mm</span>
                  </div>
                  <Slider
                    value={[proximity.minProximity]}
                    onValueChange={([v]) => handleProximityChange('minProximity', v)}
                    min={120}
                    max={200}
                    step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Velocidad:</Label>
                    <span className="text-sm">{elevator.speed} pasos/s</span>
                  </div>
                  <Slider
                    value={[elevator.speed]}
                    onValueChange={([v]) => handleElevatorChange('speed', v)}
                    min={elevator.minSpeed}
                    max={elevator.maxSpeed}
                    step={10}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Manual Controls - Only in Manual Mode */}
              {isManualMode && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-medium">Control Manual:</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={testElevatorUp} className="flex-1">
                      <ArrowUp className="h-3 w-3" />
                      Subir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testElevatorDown}
                      className="flex-1"
                    >
                      <ArrowDown className="h-3 w-3" />
                      Bajar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={testElevatorStop}
                      className="flex-1"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* 2. DOSING WHEEL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Rueda Dosificadora</h3>
              <LoaderPinwheel className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              {/* Ciclo */}
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground text-xs font-semibold">Ciclo</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo estabilización:</Label>
                    <span className="text-sm">{delays.settle}ms</span>
                  </div>
                  <Slider
                    value={[delays.settle]}
                    onValueChange={([v]) => handleDelayChange('settle', v)}
                    max={10_000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="my-3 border-t" />

              {/* Configuración */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">Configuración</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Divisiones de Rueda:</Label>
                    <span className="text-sm">{dosing.wheelDivisions}</span>
                  </div>
                  <Slider
                    value={[dosing.wheelDivisions]}
                    onValueChange={([v]) => handleDosingChange('wheelDivisions', v)}
                    min={1}
                    max={64}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tamaño de Lote:</Label>
                    <span className="text-sm">{dosing.lotSize}</span>
                  </div>
                  <Slider
                    value={[dosing.lotSize]}
                    onValueChange={([v]) => handleDosingChange('lotSize', v)}
                    min={1}
                    max={64}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Velocidad Motor:</Label>
                    <span className="text-sm">{dosing.motorSpeed?.toFixed(1) || '-'} rad/s</span>
                  </div>
                  <Slider
                    value={[dosing.motorSpeed || 0]}
                    onValueChange={([v]) => handleDosingChange('motorSpeed', v)}
                    min={0.01}
                    max={4}
                    step={0.01}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Manual Controls - Only in Manual Mode */}
              {isManualMode && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-medium">Control Manual:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testDosingForward}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3" />
                      Girar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={dispenseOnePill}
                      className="flex-1"
                    >
                      <RedoDot className="h-3 w-3" />1 Píldora
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={testDosingStop}
                      className="flex-1"
                    >
                      <Square className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* 3. LOAD CELL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Celda de Carga</h3>
              <Scale className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              {/* Ciclo */}
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground text-xs font-semibold">Ciclo</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo estabilización peso:</Label>
                    <span className="text-sm">{delays.weight}ms</span>
                  </div>
                  <Slider
                    value={[delays.weight]}
                    onValueChange={([v]) => handleDelayChange('weight', v)}
                    max={10_000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="my-3 border-t" />

              {/* Configuración */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">Configuración</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Factor de calibración:</Label>
                    <span className="text-sm">{loadCell.calibrationFactor.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[loadCell.calibrationFactor]}
                    onValueChange={([v]) => handleLoadCellChange('calibrationFactor', v)}
                    min={100}
                    max={10000}
                    step={10}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Filtro de ruido (deadband):</Label>
                    <span className="text-sm">{loadCell.deadband.toFixed(3)}g</span>
                  </div>
                  <Slider
                    value={[loadCell.deadband]}
                    onValueChange={([v]) => handleLoadCellChange('deadband', v)}
                    min={0.001}
                    max={1}
                    step={0.001}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Manual Controls - Only in Manual Mode */}
              {isManualMode && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-medium">Control Manual:</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={testLoadCell} className="flex-1">
                      <Eye className="h-3 w-3" />
                      Test
                    </Button>
                    <Button variant="outline" size="sm" onClick={tareLoadCell} className="flex-1">
                      <Scale className="h-3 w-3" />
                      Tarar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* 4. TRANSFER SOLENOID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Solenoide Transferencia</h3>
              <ArrowRightFromLine className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              {/* Ciclo */}
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground text-xs font-semibold">Ciclo</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo de empuje:</Label>
                    <span className="text-sm">{delays.transfer}ms</span>
                  </div>
                  <Slider
                    value={[delays.transfer]}
                    onValueChange={([v]) => handleDelayChange('transfer', v)}
                    max={10_000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="my-3 border-t" />

              {/* Protecciones */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">Protecciones</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo máximo operación:</Label>
                    <span className="text-sm">{timeouts.transferMax}ms</span>
                  </div>
                  <Slider
                    value={[timeouts.transferMax]}
                    onValueChange={([v]) => handleTimeoutChange('transferMax', v)}
                    min={1000}
                    max={30_000}
                    step={500}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Manual Controls - Only in Manual Mode */}
              {isManualMode && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-medium">Control Manual:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testTransferOpen}
                      className="flex-1"
                    >
                      <Power className="h-3 w-3" />
                      Abrir
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={testTransferClose}
                      className="flex-1"
                    >
                      <PowerOff className="h-3 w-3" />
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* 5. MIXER/GRINDER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Molinillo</h3>
              <Blend className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              {/* Ciclo */}
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground text-xs font-semibold">Ciclo</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo de molienda:</Label>
                    <span className="text-sm">{delays.grind}ms</span>
                  </div>
                  <Slider
                    value={[delays.grind]}
                    onValueChange={([v]) => handleDelayChange('grind', v)}
                    max={10_000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="my-3 border-t" />

              {/* Protecciones */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">Protecciones</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo máximo operación:</Label>
                    <span className="text-sm">{timeouts.grinderMax}ms</span>
                  </div>
                  <Slider
                    value={[timeouts.grinderMax]}
                    onValueChange={([v]) => handleTimeoutChange('grinderMax', v)}
                    min={1_000}
                    max={120_000}
                    step={1000}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Manual Controls - Only in Manual Mode */}
              {isManualMode && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-medium">Control Manual:</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={testGrinderOn} className="flex-1">
                      <Play className="h-3 w-3" />
                      Encender
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={testGrinderOff}
                      className="flex-1"
                    >
                      <Square className="h-3 w-3" />
                      Apagar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* 6. CAPPER SOLENOID */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-medium">Solenoide Tapado</h3>
              <CircleDot className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              {/* Ciclo */}
              <div className="space-y-2 pt-2">
                <Label className="text-muted-foreground text-xs font-semibold">Ciclo</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo de empuje:</Label>
                    <span className="text-sm">{delays.cap}ms</span>
                  </div>
                  <Slider
                    value={[delays.cap]}
                    onValueChange={([v]) => handleDelayChange('cap', v)}
                    max={10_000}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="my-3 border-t" />

              {/* Protecciones */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">Protecciones</Label>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <Label className="text-xs">Tiempo máximo operación:</Label>
                    <span className="text-sm">{timeouts.capMax}ms</span>
                  </div>
                  <Slider
                    value={[timeouts.capMax]}
                    onValueChange={([v]) => handleTimeoutChange('capMax', v)}
                    min={1000}
                    max={30_000}
                    step={500}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Manual Controls - Only in Manual Mode */}
              {isManualMode && (
                <div className="space-y-1 pt-2">
                  <Label className="text-xs font-medium">Control Manual:</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={testCapPush} className="flex-1">
                      <Power className="h-3 w-3" />
                      Empujar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={testCapRetract}
                      className="flex-1"
                    >
                      <PowerOff className="h-3 w-3" />
                      Retraer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
