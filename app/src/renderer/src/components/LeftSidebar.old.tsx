import { Button } from '@renderer/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@renderer/components/ui/select'
import { useConnectionStore } from '@renderer/store/connectionStore'
import { useUIStore } from '@renderer/store/uiStore'
import { RefreshCw, Wifi, WifiOff, Wrench } from 'lucide-react'
import React, { useState } from 'react'
import { ManualControlPanel } from './panels/ManualControlPanel'
import { SettingsPanel } from './panels/SettingsPanel'

interface LeftSidebarProps {
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ onConnect, onDisconnect }) => {
  const { ports, selectedPort, isConnected, connectionError, setSelectedPort } =
    useConnectionStore()
  const { currentMode } = useUIStore()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshPorts = async () => {
    setIsRefreshing(true)
    try {
      const newPorts = await window.serial.list()
      useConnectionStore.getState().setPorts(newPorts)
    } catch (error) {
      console.error('Failed to refresh ports:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Connection Card */}
      <Card className="m-4 mb-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5" />
            )}
            Serial Connection
          </CardTitle>
          <CardDescription>
            {isConnected ? `Connected to ${selectedPort}` : 'Select a port to connect'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Select value={selectedPort} onValueChange={setSelectedPort} disabled={isConnected}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select port..." />
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
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {connectionError && <div className="text-destructive text-sm">{connectionError}</div>}

          <Button
            className="w-full"
            variant={isConnected ? 'destructive' : 'default'}
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={!selectedPort && !isConnected}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </CardContent>
      </Card>

      {/* Main Content - Settings or Manual Controls */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {currentMode === 'manual' ? (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              <h3 className="font-semibold">Manual Controls</h3>
            </div>
            <ManualControlPanel />
          </div>
        ) : (
          <SettingsPanel />
        )}
      </div>
    </div>
  )
}
