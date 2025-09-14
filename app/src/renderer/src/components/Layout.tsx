import { useConnectionStore } from '@renderer/store/connectionStore'
import { useUIStore } from '@renderer/store/uiStore'
import { ViewMode } from '@renderer/types'
import { Boxes, Settings2, Terminal, View, Wifi, WifiOff } from 'lucide-react'
import React from 'react'
import { cn } from '../lib/utils'
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

  const { currentView, setView } = useUIStore()
  const { isConnected, selectedPort } = useConnectionStore()

  return (
    <div className="bg-background relative flex h-screen overflow-hidden">
      {/* Left Sidebar */}
      <div
        className={cn(
          'border-border bg-card border-r transition-all duration-300',
          showLeftSidebar ? 'w-80' : 'w-0'
        )}
      >
        {showLeftSidebar && <div className="h-full overflow-y-auto">{leftSidebar}</div>}
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-auto">
        {children}

        {/* Header Controls Bar */}
        <div className="absolute top-4 right-4 left-4 z-40 flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onToggleLeftSidebar}
              variant={showLeftSidebar ? 'ghost' : 'secondary'}
              size="sm"
              className="gap-1 shadow-lg"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">{showLeftSidebar ? '◀' : 'Settings'}</span>
            </Button>

            {/* Connection Status */}
            <Badge variant={isConnected ? 'default' : 'destructive'} className="gap-1">
              {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {isConnected ? selectedPort : 'Disconnected'}
            </Badge>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-3">
            <div className="bg-border h-6 w-px" />

            <div className="flex gap-1">
              <Button
                onClick={() => setView(ViewMode.STANDARD)}
                variant={currentView === ViewMode.STANDARD ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                <View className="h-4 w-4" />
                Dashboard
              </Button>
              <Button
                onClick={() => setView(ViewMode.MODEL)}
                variant={currentView === ViewMode.MODEL ? 'default' : 'secondary'}
                size="sm"
                className="gap-2"
              >
                <Boxes className="h-4 w-4" />
                3D View
              </Button>
            </div>
          </div>

          {/* Right Controls */}
          <Button
            onClick={onToggleRightSidebar}
            variant={showRightSidebar ? 'ghost' : 'secondary'}
            size="sm"
            className="gap-1 shadow-lg"
          >
            <Terminal className="h-4 w-4" />
            <span className="hidden sm:inline">{showRightSidebar ? '▶' : 'Status'}</span>
          </Button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div
        className={cn(
          'border-border bg-card border-l transition-all duration-300',
          showRightSidebar ? 'w-120' : 'w-0'
        )}
      >
        {showRightSidebar && <div className="h-full overflow-y-auto">{rightSidebar}</div>}
      </div>
    </div>
  )
}
