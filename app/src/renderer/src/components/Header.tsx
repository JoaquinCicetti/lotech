import { Power, Settings, Terminal, ToggleLeft, ToggleRight } from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'

interface HeaderProps {
  simulationMode: boolean
  showConsole: boolean
  onToggleSimulation: () => void
  onToggleConsole: () => void
  onOpenSettings: () => void
  onDisconnect: () => void
}

interface ModeToggleProps {
  simulationMode: boolean
  onToggle: () => void
}

const ModeToggle: React.FC<ModeToggleProps> = (props) => {
  const { simulationMode, onToggle } = props

  return (
    <div className="bg-muted border-border flex items-center gap-2 rounded-lg border px-4 py-2">
      <span className="text-muted-foreground text-sm">Modo:</span>
      <Button
        onClick={onToggle}
        variant={simulationMode ? 'secondary' : 'default'}
        size="sm"
        className="gap-2"
      >
        {simulationMode ? (
          <>
            <ToggleLeft className="h-4 w-4" />
            SIMULACIÓN
          </>
        ) : (
          <>
            <ToggleRight className="h-4 w-4" />
            REAL
          </>
        )}
      </Button>
    </div>
  )
}

export const Header: React.FC<HeaderProps> = (props) => {
  const {
    simulationMode,
    showConsole,
    onToggleSimulation,
    onToggleConsole,
    onOpenSettings,
    onDisconnect,
  } = props

  return (
    <div className="mb-10 flex items-center justify-between">
      <h1 className="text-3xl font-light">LOTECH Controller</h1>

      <div className="flex items-center gap-3">
        <ModeToggle simulationMode={simulationMode} onToggle={onToggleSimulation} />

        <Button onClick={onOpenSettings} variant="outline" size="default" className="gap-2">
          <Settings className="h-4 w-4" />
          Configuración
        </Button>

        <Button onClick={onToggleConsole} variant="outline" size="default" className="gap-2">
          <Terminal className="h-4 w-4" />
          {showConsole ? 'Ocultar' : 'Mostrar'} consola
        </Button>

        <Button onClick={onDisconnect} variant="destructive" size="default" className="gap-2">
          <Power className="h-4 w-4" />
          Desconectar
        </Button>
      </div>
    </div>
  )
}
