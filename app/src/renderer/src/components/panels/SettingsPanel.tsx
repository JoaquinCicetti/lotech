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
  updateDelays,
  updateDosing,
  updateElevator,
  updateProximity,
  updateTimeouts,
} from '@renderer/serial/serialCommands'
import { useSettingsStore } from '@renderer/store/settingsStore'
import {
  DelaySettings,
  DosingSettings,
  ElevatorSettings,
  HardwareTimeouts,
  ProximitySettings,
} from '@renderer/types'
import { ArrowsUpFromLine, Clock, LoaderPinwheel, Shield } from 'lucide-react'
import React from 'react'
import { Slider } from '../ui/slider'

export const SettingsPanel: React.FC = () => {
  const {
    delays,
    dosing,
    proximity,
    elevator,
    timeouts,
    updateDelay,
    updateDosing: updateDosingStore,
    updateProximity: updateProximityStore,
    updateElevator: updateElevatorStore,
    updateTimeout,
  } = useSettingsStore()

  // Create debounced functions outside of useCallback
  const sendDelaysDebounced = debounce((delays: DelaySettings) => {
    updateDelays(delays)
  }, 500)

  const sendDosingDebounced = debounce((dosing: DosingSettings) => {
    updateDosing(dosing.wheelDivisions, dosing.lotSize, dosing.motorSpeed)
  }, 500)

  const sendProximityDebounced = debounce((proximity: ProximitySettings) => {
    updateProximity(proximity.minProximity, proximity.maxProximity)
  }, 500)

  const sendElevatorDebounced = debounce((speed: number) => {
    updateElevator(speed)
  }, 500)

  const sendTimeoutsDebounced = debounce((timeouts: HardwareTimeouts) => {
    updateTimeouts(timeouts)
  }, 500)

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Ajustes</CardTitle>
        <CardDescription>Configuración de parámetros del sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-10">
          {/* Delay Settings */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Retardos (ms)</h3>
              <Clock className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Transferencia: </Label>
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

              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Molienda: </Label>
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

              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Tapado:</Label>
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
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Pesaje</h3>
              <Clock className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Tiempo límite: </Label>
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
          </div>

          {/* Elevator Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Elevador</h3>
              <ArrowsUpFromLine className="h-4 w-4" />
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

            <div className="space-y-1">
              <div className="flex justify-between">
                <Label className="text-xs">Tiempo límite de Subida:</Label>
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
                <Label className="text-xs">Tiempo límite de Bajada: </Label>
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
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Posición inferior:</Label>
                  <span className="text-sm">{proximity.minProximity}</span>
                </div>
                <Slider
                  value={[proximity.minProximity]}
                  onValueChange={([v]) => handleProximityChange('minProximity', v)}
                  max={500}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Posición superior:</Label>
                  <span className="text-sm">{proximity.maxProximity}</span>
                </div>
                <Slider
                  value={[proximity.maxProximity]}
                  onValueChange={([v]) => handleProximityChange('maxProximity', v)}
                  max={1024}
                  step={5}
                  min={proximity.minProximity}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Dosing Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Dosificadora</h3>
              <LoaderPinwheel className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Divisiones de Rueda: </Label>
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
                  <Label className="text-xs">Tamaño de Lote: </Label>
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
                  <Label className="text-xs">Velocidad del Motor:</Label>
                  <span className="text-sm">{dosing.motorSpeed?.toFixed(1) || '-'} rad/s</span>
                </div>
                <Slider
                  value={[dosing.motorSpeed || 0]}
                  onValueChange={([v]) => handleDosingChange('motorSpeed', v)}
                  min={0.5}
                  max={4}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Tiempo limite: </Label>
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
          </div>

          {/* Hardware Protection Timeouts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Protección de Hardware</h3>
              <Shield className="h-4 w-4" />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Tiempo Máx. Solenoide Transfer:</Label>
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

              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Tiempo Máx. Solenoide Tapa:</Label>
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

              <div className="space-y-1">
                <div className="flex justify-between">
                  <Label className="text-xs">Tiempo Máx. Molinillo:</Label>
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
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
