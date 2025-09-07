import { Play, RotateCcw } from 'lucide-react'
import React from 'react'
import { SystemStatus } from '../types'

interface ControlPanelProps {
  systemStatus: SystemStatus
  simulationMode: boolean
  onSendCommand: (cmd: string) => void
  onToggleSensor: (sensor: string, value: boolean) => void
  onUpdateStatus: (status: Partial<SystemStatus>) => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  systemStatus,
  simulationMode,
  onSendCommand,
  onToggleSensor,
  onUpdateStatus,
}) => {
  const handleSensorToggle = (key: keyof SystemStatus['sensors'], sensor: string): void => {
    const newValue = !systemStatus.sensors[key]

    // Prevent both positions being active at the same time
    if (key === 'posAlta' && newValue && systemStatus.sensors.posBaja) {
      onToggleSensor('POS_BAJA', false)
      onUpdateStatus({
        sensors: {
          ...systemStatus.sensors,
          posBaja: false,
        },
      })
    } else if (key === 'posBaja' && newValue && systemStatus.sensors.posAlta) {
      onToggleSensor('POS_ALTA', false)
      onUpdateStatus({
        sensors: {
          ...systemStatus.sensors,
          posAlta: false,
        },
      })
    } else {
      onUpdateStatus({
        sensors: {
          ...systemStatus.sensors,
          [key]: newValue,
        },
      })
    }

    onToggleSensor(sensor, newValue)
  }

  const isStartEnabled = systemStatus.sensors.pastillasCargadas && systemStatus.sensors.frascoVacio
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        marginBottom: 32,
      }}
    >
      {/* Actions */}
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 500, color: '#718096' }}>
          ACCIONES
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => onSendCommand('BTN:START')}
            disabled={!isStartEnabled}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              filter: isStartEnabled ? undefined : 'grayscale(.65)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Play size={16} />
            INICIO
          </button>
          <button
            onClick={() => onSendCommand('BTN:RESET')}
            style={{
              flex: 1,
              padding: '12px',
              background: '#2d3748',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={16} />
            RESET
          </button>
        </div>
        {simulationMode && (
          <button
            onClick={() => onSendCommand('RESET:ALL')}
            style={{
              width: '100%',
              marginTop: 12,
              padding: '12px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={16} />
            REINICIAR TODO
          </button>
        )}
      </div>

      {/* Sensors */}
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          opacity: simulationMode ? 1 : 0.5,
          pointerEvents: simulationMode ? 'auto' : 'none',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 500, color: '#718096' }}>
          SENSORES {!simulationMode && '(Modo Real)'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'posAlta' as const, label: 'Pos. Alta', sensor: 'POS_ALTA' },
            { key: 'posBaja' as const, label: 'Pos. Baja', sensor: 'POS_BAJA' },
            { key: 'weightStable' as const, label: 'Peso OK', sensor: 'WEIGHT_STABLE' },
          ].map(({ key, label, sensor }) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{label}</span>
              <div
                onClick={() => handleSensorToggle(key, sensor)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: systemStatus.sensors[key]
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#2d3748',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: systemStatus.sensors[key] ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 12,
          padding: 24,
          opacity: simulationMode ? 1 : 0.5,
          pointerEvents: simulationMode ? 'auto' : 'none',
        }}
      >
        <h3 style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 500, color: '#718096' }}>
          CONDICIONES {!simulationMode && '(Modo Real)'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'frascoVacio' as const, label: 'Frasco vacío', sensor: 'FRASCO_VACIO' },
            {
              key: 'pastillasCargadas' as const,
              label: 'Pastillas OK',
              sensor: 'PASTILLAS_CARGADAS',
            },
          ].map(({ key, label, sensor }) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 14 }}>{label}</span>
              <div
                onClick={() => handleSensorToggle(key, sensor)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: systemStatus.sensors[key]
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : '#2d3748',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.3s',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: systemStatus.sensors[key] ? 22 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
