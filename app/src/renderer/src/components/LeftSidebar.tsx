import {
  tareLoadCell,
  testCapPush,
  testCapRetract,
  testDosingBackward,
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
  updateProximity,
} from '@renderer/commands/serialCommands'
import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Label } from '@renderer/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { Slider } from '@renderer/components/ui/slider'
import { debounce } from '@renderer/lib/utils'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useUIStore } from '@renderer/store/uiStore'
import { DelaySettings, DosingSettings, ProximitySettings } from '@renderer/types'
import { Clock, Package, RefreshCw, Ruler, Wifi, WifiOff, Wrench } from 'lucide-react'
import React, { useState } from 'react'
import { ModeSwitcher } from './ModeSwitcher'

interface LeftSidebarProps {
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onConnect, onDisconnect }) => {
  const { ports, selectedPort, isConnected, connectionError, setSelectedPort } =
    useConnectionStore()

  const {
    delays,
    dosing,
    proximity,
    updateDelay,
    updateDosing: updateDosingStore,
    updateProximity: updateProximityStore,
  } = useSettingsStore()

  const { currentMode } = useUIStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Create debounced functions outside of useCallback
  const sendDelaysDebounced = debounce((delays: DelaySettings) => {
    updateDelays(delays)
  }, 500)

  const sendDosingDebounced = debounce((dosing: DosingSettings) => {
    updateDosing(dosing.wheelDivisions, dosing.lotSize)
  }, 500)

  const sendProximityDebounced = debounce((proximity: ProximitySettings) => {
    updateProximity(proximity.minProximity, proximity.maxProximity)
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

  const handleRefreshPorts = async () => {
    setIsRefreshing(true)
    try {
      const newPorts = await window.serial.list()
      useConnectionStore.getState().setPorts(newPorts)
    } catch (error) {
      console.error('Error al actualizar puertos:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Connection Card - Always at top */}
      <Card className="mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            Conexión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={selectedPort} onValueChange={setSelectedPort} disabled={isConnected}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <SelectValue placeholder="Seleccionar puerto..." />
              </SelectTrigger>
              <SelectContent>
                {ports.map((port) => (
                  <SelectItem key={port.path} value={port.path}>
                    {port.friendlyName || port.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              onClick={handleRefreshPorts}
              disabled={isConnected || isRefreshing}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {connectionError && <div className="text-destructive text-xs">{connectionError}</div>}

          <Button
            className="h-8 w-full text-xs"
            variant={isConnected ? 'destructive' : 'default'}
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={!selectedPort && !isConnected}
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
        </CardContent>
      </Card>

      {/* Settings - Always visible, scrollable */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
        {/* Delay Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <h3 className="text-sm font-medium">Retardos (ms)</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Estabilización: {delays.settle}ms</Label>
              <Slider
                value={[delays.settle]}
                onValueChange={([v]) => handleDelayChange('settle', v)}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Pesaje: {delays.weight}ms</Label>
              <Slider
                value={[delays.weight]}
                onValueChange={([v]) => handleDelayChange('weight', v)}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Transferencia: {delays.transfer}ms</Label>
              <Slider
                value={[delays.transfer]}
                onValueChange={([v]) => handleDelayChange('transfer', v)}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Molienda: {delays.grind}ms</Label>
              <Slider
                value={[delays.grind]}
                onValueChange={([v]) => handleDelayChange('grind', v)}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tapado: {delays.cap}ms</Label>
              <Slider
                value={[delays.cap]}
                onValueChange={([v]) => handleDelayChange('cap', v)}
                max={5000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Elevador Subida: {delays.elevUp}ms</Label>
              <Slider
                value={[delays.elevUp]}
                onValueChange={([v]) => handleDelayChange('elevUp', v)}
                max={10000}
                step={100}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Elevador Bajada: {delays.elevDown}ms</Label>
              <Slider
                value={[delays.elevDown]}
                onValueChange={([v]) => handleDelayChange('elevDown', v)}
                max={10000}
                step={100}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Dosing Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <h3 className="text-sm font-medium">Dosificación</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Divisiones de Rueda: {dosing.wheelDivisions}</Label>
              <Slider
                value={[dosing.wheelDivisions]}
                onValueChange={([v]) => handleDosingChange('wheelDivisions', v)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tamaño de Lote: {dosing.lotSize}</Label>
              <Slider
                value={[dosing.lotSize]}
                onValueChange={([v]) => handleDosingChange('lotSize', v)}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Proximity Settings */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4" />
            <h3 className="text-sm font-medium">Proximidad</h3>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Distancia Mín: {proximity.minProximity}mm</Label>
              <Slider
                value={[proximity.minProximity]}
                onValueChange={([v]) => handleProximityChange('minProximity', v)}
                max={300}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Distancia Máx: {proximity.maxProximity}mm</Label>
              <Slider
                value={[proximity.maxProximity]}
                onValueChange={([v]) => handleProximityChange('maxProximity', v)}
                max={1024}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Manual Controls - Only visible in manual mode */}
        {currentMode === 'manual' && (
          <>
            <div className="mt-4 border-t pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                <h3 className="text-sm font-medium">Manual Controls</h3>
              </div>

              {/* Motor Controls */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Dosing Motor</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testDosingForward}
                      className="h-7 flex-1 text-xs"
                    >
                      FWD
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testDosingBackward}
                      className="h-7 flex-1 text-xs"
                    >
                      BWD
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={testDosingStop}
                      className="h-7 px-2 text-xs"
                    >
                      STOP
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Elevator</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testElevatorUp}
                      className="h-7 flex-1 text-xs"
                    >
                      UP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testElevatorDown}
                      className="h-7 flex-1 text-xs"
                    >
                      DOWN
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={testElevatorStop}
                      className="h-7 px-2 text-xs"
                    >
                      STOP
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Grinder</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testGrinderOn}
                      className="h-7 flex-1 text-xs"
                    >
                      ON
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testGrinderOff}
                      className="h-7 flex-1 text-xs"
                    >
                      OFF
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Transfer</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testTransferOpen}
                      className="h-7 flex-1 text-xs"
                    >
                      OPEN
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testTransferClose}
                      className="h-7 flex-1 text-xs"
                    >
                      CLOSE
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Cap</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testCapPush}
                      className="h-7 flex-1 text-xs"
                    >
                      PUSH
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testCapRetract}
                      className="h-7 flex-1 text-xs"
                    >
                      RETRACT
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium">Load Cell</Label>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={testLoadCell}
                      className="h-7 flex-1 text-xs"
                    >
                      TEST
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={tareLoadCell}
                      className="h-7 flex-1 text-xs"
                    >
                      TARE
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        <ModeSwitcher />
      </div>
    </div>
  )
}
