import { useConnectionStore } from '@renderer/store/connectionStore'
import { Settings2, Terminal, Wifi, WifiOff } from 'lucide-react'
import React from 'react'
import { cn } from '../lib/utils'
import { CameraSelector } from './3d/CameraSelector'
import { ModeSelector } from './ModeSelector'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

interface LayoutProps {
  children: React.ReactNode
  leftSidebar?: React.ReactNode
  rightSidebar?: React.ReactNode
  showLeftSidebar?: boolean
  showRightSidebar?: boolean
  onToggleLeftSidebar?: () => void
  onToggleRightSidebar?: () => void
}

export const Layout: React.FC<LayoutProps> = (props) => {
  const {
    children,
    leftSidebar,
    rightSidebar,
    showLeftSidebar = false,
    showRightSidebar = false,
    onToggleLeftSidebar,
    onToggleRightSidebar,
  } = props

  const { isConnected, selectedPort } = useConnectionStore()

  return (
    <div className="bg-background relative h-screen overflow-hidden">
      {/* Main Content Area - Always Full Width */}
      <div className="relative h-full w-full overflow-auto">
        {children}

        {/* Header Controls Bar */}
        <div className="absolute top-4 right-4 left-4 z-[60] flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onToggleLeftSidebar}
              variant={showLeftSidebar ? 'ghost' : 'secondary'}
              className="gap-1 shadow-lg"
            >
              <Settings2 className="h-4 w-4" />
            </Button>

            {/* Connection Status */}
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? selectedPort : 'Desconectado'}
            </Badge>
          </div>

          {/* Center Controls - Mode Switcher and Camera Selector */}
          <div className="flex items-center gap-4">
            <ModeSelector />
            <CameraSelector />
          </div>

          {/* Right Controls */}
          <Button
            onClick={onToggleRightSidebar}
            variant={showRightSidebar ? 'ghost' : 'secondary'}
            size="sm"
            className="gap-1 shadow-lg"
          >
            <Terminal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Left Sidebar Overlay */}
      <div
        className={cn(
          'border-border bg-card/80 absolute top-0 left-0 z-50 h-full w-100 border-r shadow-2xl backdrop-blur-lg transition-transform duration-300',
          showLeftSidebar ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full overflow-y-auto">{leftSidebar}</div>
      </div>

      {/* Right Sidebar Overlay */}
      <div
        className={cn(
          'border-border bg-card/80 absolute top-0 right-0 z-50 h-full w-100 border-l shadow-2xl backdrop-blur-lg transition-transform duration-300',
          showRightSidebar ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="h-full overflow-y-auto">{rightSidebar}</div>
      </div>
    </div>
  )
}
