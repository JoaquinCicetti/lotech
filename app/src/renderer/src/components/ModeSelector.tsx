import { Card } from '@renderer/components/ui/card'
import { setAutoMode, setManualMode } from '@renderer/serial/serialCommands'
import { useUIStore } from '@renderer/store/uiStore'
import { AppMode } from '@renderer/types'
import { Hand, Zap } from 'lucide-react'
import React from 'react'

interface ModeConfig {
  id: AppMode
  label: string
  icon: React.ReactNode
  key: string
  action: () => void
}

const MODES: ModeConfig[] = [
  {
    id: AppMode.MANUAL,
    label: 'Manual',
    icon: <Hand className="h-4 w-4" />,
    key: 'M',
    action: setManualMode,
  },
  {
    id: AppMode.AUTO,
    label: 'Auto',
    icon: <Zap className="h-4 w-4" />,
    key: 'A',
    action: setAutoMode,
  },
]

export const ModeSelector: React.FC = () => {
  const { currentMode, setMode } = useUIStore()

  const handleModeChange = (mode: ModeConfig) => {
    setMode(mode.id)
    mode.action()
  }

  return (
    <Card className="bg-background/80 shadow-lg backdrop-blur-sm">
      <div className="flex gap-1 p-2">
        {MODES.map((mode) => {
          const isActive = currentMode === mode.id
          const isManual = mode.id === AppMode.MANUAL

          return (
            <button
              key={mode.id}
              onClick={() => handleModeChange(mode)}
              className={`group relative flex flex-col items-center gap-1 rounded-md px-3 py-2 transition-all ${
                isActive
                  ? isManual
                    ? 'from-destructive to-destructive/80 text-destructive-foreground bg-gradient-to-br'
                    : 'from-primary to-primary/80 text-primary-foreground bg-gradient-to-br'
                  : 'hover:bg-muted'
              }`}
              title={`${mode.label} (${mode.key})`}
            >
              {mode.icon}
              <span className="text-[10px] font-medium">{mode.label}</span>
              <span className="text-muted-foreground absolute -top-1 -right-1 rounded bg-gray-800 px-1 text-[8px] opacity-0 transition-opacity group-hover:opacity-100">
                {mode.key}
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
