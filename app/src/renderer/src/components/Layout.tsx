import React from 'react'
import { Settings2, Terminal } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

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

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Left Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 border-r border-border bg-card",
          showLeftSidebar ? "w-80" : "w-0"
        )}
      >
        {showLeftSidebar && (
          <div className="h-full overflow-y-auto">
            {leftSidebar}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative">
        {children}
        
        {/* Left Sidebar Toggle - Inside main content */}
        <Button
          onClick={onToggleLeftSidebar}
          variant={showLeftSidebar ? "ghost" : "secondary"}
          size="sm"
          className={cn(
            "absolute top-4 z-40 shadow-lg gap-1 transition-all",
            showLeftSidebar ? "left-2" : "left-4"
          )}
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">
            {showLeftSidebar ? "◀" : "Control"}
          </span>
        </Button>
        
        {/* Right Sidebar Toggle - Inside main content */}
        <Button
          onClick={onToggleRightSidebar}
          variant={showRightSidebar ? "ghost" : "secondary"}
          size="sm"
          className={cn(
            "absolute top-4 z-40 shadow-lg gap-1 transition-all",
            showRightSidebar ? "right-2" : "right-4"
          )}
        >
          <Terminal className="h-4 w-4" />
          <span className="hidden sm:inline">
            {showRightSidebar ? "▶" : "Consola"}
          </span>
        </Button>
      </div>

      {/* Right Sidebar */}
      <div
        className={cn(
          "transition-all duration-300 border-l border-border bg-card",
          showRightSidebar ? "w-96" : "w-0"
        )}
      >
        {showRightSidebar && (
          <div className="h-full overflow-y-auto">
            {rightSidebar}
          </div>
        )}
      </div>
    </div>
  )
}