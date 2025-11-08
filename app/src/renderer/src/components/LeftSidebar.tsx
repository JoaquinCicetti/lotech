import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { RefreshCw, Wifi, WifiOff } from 'lucide-react'
import React, { useState } from 'react'
import { SettingsPanel } from './panels/SettingsPanel'

interface LeftSidebarProps {
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
}

export const LeftSidebar: React.FC<LeftSidebarProps> = (props) => {
  const { onConnect, onDisconnect } = props

  const { ports, selectedPort, isConnected, connectionError, setSelectedPort } =
    useConnectionStore()

  const [isRefreshing, setIsRefreshing] = useState(false)

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
    <div className="flex h-full flex-col p-1">
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
      <div className="flex-1 space-y-4 overflow-y-auto">
        <SettingsPanel />
      </div>
    </div>
  )
}
