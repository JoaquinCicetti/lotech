import { Wifi } from 'lucide-react'
import React from 'react'
import { SerialPortInfo } from '../types'

interface ConnectionScreenProps {
  ports: SerialPortInfo[]
  selected: string
  onSelectPort: (port: string) => void
  onConnect: () => void
}

export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({
  ports,
  selected,
  onSelectPort,
  onConnect,
}) => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 20,
          padding: 40,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center',
          minWidth: 400,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Wifi size={48} strokeWidth={1.5} color="#667eea" />
        </div>
        <h1 style={{ margin: '0 0 30px', fontSize: 32, fontWeight: 300 }}>LOTECH</h1>
        <select
          onChange={(e) => onSelectPort(e.target.value)}
          value={selected}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            marginBottom: 16,
            background: 'white',
          }}
        >
          <option value="">Seleccionar puerto...</option>
          {ports.map((p) => (
            <option key={p.path} value={p.path}>
              {p.friendlyName ?? p.path}
            </option>
          ))}
        </select>
        <button
          onClick={onConnect}
          disabled={!selected}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 500,
            color: 'white',
            background: selected ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e0',
            border: 'none',
            borderRadius: 8,
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s',
          }}
        >
          Conectar
        </button>
      </div>
    </div>
  )
}
