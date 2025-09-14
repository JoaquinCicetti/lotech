import { useAppStore } from '@renderer/store/appStore'
import { ViewMode } from '@renderer/types'
import { Boxes, Settings2, Terminal, View } from 'lucide-react'
import React from 'react'
import { cn } from '../lib/utils'
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

  const { currentView, setCurrentView } = useAppStore()
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

        {/* Left Sidebar Toggle - Inside main content */}
        <Button
          onClick={onToggleLeftSidebar}
          variant={showLeftSidebar ? 'ghost' : 'secondary'}
          size="sm"
          className={cn(
            'absolute top-4 z-40 gap-1 shadow-lg transition-all',
            showLeftSidebar ? 'left-2' : 'left-4'
          )}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">{showLeftSidebar ? '◀' : 'Control'}</span>
        </Button>

        <div
          className={cn(
            'absolute top-4 left-1/2 z-40 grid -translate-x-1/2 grid-cols-2 gap-1 gap-2 shadow-lg'
          )}
        >
          <Button
            onClick={() => setCurrentView(ViewMode.STANDARD)}
            variant={currentView === ViewMode.STANDARD ? 'default' : 'secondary'}
            size="default"
            className="gap-2 font-medium"
          >
            <View className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            onClick={() => setCurrentView(ViewMode.MODEL)}
            variant={currentView === ViewMode.MODEL ? 'default' : 'secondary'}
            size="default"
            className="gap-2 font-medium"
          >
            <Boxes className="h-4 w-4" />
            Vista 3D
          </Button>
        </div>
        <div className="bg-border h-8 w-px" />

        {/* Right Sidebar Toggle - Inside main content */}
        <Button
          onClick={onToggleRightSidebar}
          variant={showRightSidebar ? 'ghost' : 'secondary'}
          className={cn(
            'absolute top-4 z-40 gap-1 shadow-lg transition-all',
            showRightSidebar ? 'right-2' : 'right-4'
          )}
        >
          <Terminal className="h-4 w-4" />
          <span className="hidden sm:inline">{showRightSidebar ? '▶' : 'Consola'}</span>
        </Button>
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
