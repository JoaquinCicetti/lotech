import { Button } from '@renderer/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { useTheme } from '@renderer/hooks/useTheme'

import { useConnectionStore } from '@renderer/store/connectionStore'
import { Moon, RefreshCw, Sun, Wifi, WifiOff } from 'lucide-react'
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

  const { theme, toggleTheme } = useTheme()
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
    <div className="flex h-full flex-col p-1 pt-20">
      {/* Settings - Always visible, scrollable */}
      <div className="flex-1 overflow-y-auto">
        <SettingsPanel />
      </div>

      {/* Connection Footer - Above theme switcher */}
      <div className="border-border space-y-2 border-t pt-3 pb-2">
        <div className="flex items-center gap-2 px-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="text-muted-foreground h-4 w-4" />
          )}
          <span className="text-sm font-medium">{isConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>

        <div className="flex gap-2 px-2">
          <Select value={selectedPort} onValueChange={setSelectedPort} disabled={isConnected}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="Puerto..." />
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
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {connectionError && <div className="text-destructive px-2 text-xs">{connectionError}</div>}

        <div className="px-2">
          <Button
            className="h-10 w-full"
            variant={isConnected ? 'destructive' : 'default'}
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={!selectedPort && !isConnected}
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
        </div>
      </div>

      {/* Theme Toggle Footer */}
      <div className="border-border border-t pt-2">
        <Button
          onClick={toggleTheme}
          variant="outline"
          size="lg"
          className="h-11 w-full gap-2"
          title={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-5 w-5" />
              Modo Claro
            </>
          ) : (
            <>
              <Moon className="h-5 w-5" />
              Modo Oscuro
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
