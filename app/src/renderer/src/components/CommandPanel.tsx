import { cn } from '@renderer/lib/utils'
import { Pause, Play, RotateCcw, Scale, Square } from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface CommandPanelProps {
  onSendCommand: (command: string) => void
  floating?: boolean
}

export const CommandPanel: React.FC<CommandPanelProps> = ({ onSendCommand, floating = false }) => {
  return (
    <Card
      className={cn(
        'p-4',
        floating &&
          'bg-card/95 fixed bottom-8 left-1/2 z-50 -translate-x-1/2 shadow-2xl backdrop-blur-sm'
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          <Button
            onClick={() => onSendCommand('BTN:START')}
            size="sm"
            variant="default"
            className="gap-1"
          >
            <Play className="h-3 w-3" />
            Start
          </Button>
          <Button
            onClick={() => onSendCommand('BTN:PAUSE')}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Pause className="h-3 w-3" />
            Pausar
          </Button>
          <Button
            onClick={() => onSendCommand('BTN:STOP')}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Square className="h-3 w-3" />
            Detener
          </Button>
        </div>

        <div className="bg-border h-8 w-px" />

        <div className="flex gap-2">
          <Button
            onClick={() => onSendCommand('BTN:RESET')}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>

          <Button
            onClick={() => onSendCommand('SIM:WEIGHT_STABLE:1')}
            size="sm"
            variant="outline"
            className="gap-1"
          >
            <Scale className="h-3 w-3" />
            Estabilizar
          </Button>
        </div>

        <div className="bg-border h-8 w-px" />

        <div className="flex gap-2">
          <Button
            onClick={() => onSendCommand('RESET:ALL')}
            variant="destructive"
            size="sm"
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            REINICIAR TODO
          </Button>
        </div>
      </div>
    </Card>
  )
}
