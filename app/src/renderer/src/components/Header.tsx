import { Power, Settings, Terminal, ToggleLeft, ToggleRight } from 'lucide-react'
import React from 'react'

interface HeaderProps {
  simulationMode: boolean
  showConsole: boolean
  onToggleSimulation: () => void
  onToggleConsole: () => void
  onOpenSettings: () => void
  onDisconnect: () => void
}

export const Header: React.FC<HeaderProps> = ({
  simulationMode,
  showConsole,
  onToggleSimulation,
  onToggleConsole,
  onOpenSettings,
  onDisconnect,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 300 }}>LOTECH Controller</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: '#1a1a1a',
            borderRadius: 8,
            border: '1px solid #2d3748',
          }}
        >
          <span style={{ fontSize: 14, color: '#e2e8f0' }}>Modo:</span>
          <button
            onClick={onToggleSimulation}
            style={{
              padding: '4px 12px',
              background: simulationMode ? '#667eea' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {simulationMode ? (
              <>
                <ToggleLeft size={16} />
                SIMULACIÓN
              </>
            ) : (
              <>
                <ToggleRight size={16} />
                REAL
              </>
            )}
          </button>
        </div>
        <button
          onClick={onOpenSettings}
          style={{
            padding: '8px 16px',
            background: '#1a1a1a',
            color: '#e2e8f0',
            border: '1px solid #2d3748',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Settings size={16} />
          Configuración
        </button>
        <button
          onClick={onToggleConsole}
          style={{
            padding: '8px 16px',
            background: '#1a1a1a',
            color: '#e2e8f0',
            border: '1px solid #2d3748',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Terminal size={16} />
          {showConsole ? 'Ocultar' : 'Mostrar'} consola
        </button>
        <button
          onClick={onDisconnect}
          style={{
            padding: '8px 16px',
            background: '#1a1a1a',
            color: '#ef4444',
            border: '1px solid #2d3748',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Power size={16} />
          Desconectar
        </button>
      </div>
    </div>
  )
}
