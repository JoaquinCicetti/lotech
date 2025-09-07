import { Save, Settings as SettingsIcon, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export interface DelaySettings {
  settle: number
  weight: number
  transfer: number
  grind: number
  cap: number
  elevUp: number
  elevDown: number
}

export interface DosingSettings {
  wheelDivisions: number
  lotSize: number
}

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: DelaySettings, dosing: DosingSettings) => void
  onFetchDelays: () => void
  onFetchDosing: () => void
  currentDelays?: DelaySettings
  currentDosing?: DosingSettings
}

const DEFAULT_DELAYS: DelaySettings = {
  settle: 1500,
  weight: 2000,
  transfer: 1200,
  grind: 5000,
  cap: 2500,
  elevUp: 4000,
  elevDown: 4000,
}

const DEFAULT_DOSING: DosingSettings = {
  wheelDivisions: 20,
  lotSize: 10,
}

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  onFetchDelays,
  onFetchDosing,
  currentDelays,
  currentDosing,
}) => {
  const [delays, setDelays] = useState<DelaySettings>(currentDelays || DEFAULT_DELAYS)
  const [dosing, setDosing] = useState<DosingSettings>(currentDosing || DEFAULT_DOSING)

  useEffect(() => {
    if (isOpen) {
      onFetchDelays()
      onFetchDosing()
    }
  }, [isOpen, onFetchDelays, onFetchDosing])

  useEffect(() => {
    if (currentDelays) {
      setDelays(currentDelays)
    }
  }, [currentDelays])

  useEffect(() => {
    if (currentDosing) {
      setDosing(currentDosing)
    }
  }, [currentDosing])

  const handleSave = (): void => {
    onSave(delays, dosing)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#1a1a1a',
          borderRadius: 16,
          padding: 32,
          width: 600,
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid #2d3748',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 300,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <SettingsIcon size={24} />
            Configuración de Tiempos
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#718096',
              cursor: 'pointer',
              padding: 8,
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { key: 'settle', label: 'Tiempo de Asentamiento (Dosificación)', unit: 'ms' },
            { key: 'weight', label: 'Tiempo de Estabilización (Peso)', unit: 'ms' },
            { key: 'transfer', label: 'Tiempo de Transferencia', unit: 'ms' },
            { key: 'grind', label: 'Tiempo de Molienda', unit: 'ms' },
            { key: 'cap', label: 'Tiempo de Cierre de Tapa', unit: 'ms' },
            { key: 'elevUp', label: 'Tiempo de Elevador Subiendo', unit: 'ms' },
            { key: 'elevDown', label: 'Tiempo de Elevador Bajando', unit: 'ms' },
          ].map(({ key, label, unit }) => (
            <div key={key}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 14,
                  color: '#e2e8f0',
                }}
              >
                {label}
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={delays[key as keyof DelaySettings]}
                  onChange={(e) =>
                    setDelays({ ...delays, [key]: parseInt(e.target.value) })
                  }
                  style={{
                    flex: 1,
                    height: 6,
                    background: '#2d3748',
                    borderRadius: 3,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                />
                <input
                  type="number"
                  min="500"
                  max="10000"
                  step="100"
                  value={delays[key as keyof DelaySettings]}
                  onChange={(e) =>
                    setDelays({ ...delays, [key]: parseInt(e.target.value) || 0 })
                  }
                  style={{
                    width: 100,
                    padding: '8px 12px',
                    background: '#0f0f0f',
                    border: '1px solid #2d3748',
                    borderRadius: 6,
                    color: '#e2e8f0',
                    fontSize: 14,
                  }}
                />
                <span style={{ color: '#718096', fontSize: 14, width: 30 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dosing Parameters */}
        <h3 style={{ marginTop: 32, marginBottom: 20, fontSize: 16, fontWeight: 600 }}>
          Parámetros de Dosificación
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                color: '#e2e8f0',
              }}
            >
              Divisiones de la Rueda
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={dosing.wheelDivisions}
              onChange={(e) =>
                setDosing({ ...dosing, wheelDivisions: parseInt(e.target.value) || 1 })
              }
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0f0f0f',
                border: '1px solid #2d3748',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: 14,
              }}
            />
            <small style={{ color: '#718096', fontSize: 12 }}>
              Número de posiciones en la rueda dosificadora
            </small>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                color: '#e2e8f0',
              }}
            >
              Tamaño del Lote
            </label>
            <input
              type="number"
              min="1"
              max={dosing.wheelDivisions}
              value={dosing.lotSize}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                setDosing({ 
                  ...dosing, 
                  lotSize: Math.min(value, dosing.wheelDivisions) 
                })
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0f0f0f',
                border: '1px solid #2d3748',
                borderRadius: 6,
                color: '#e2e8f0',
                fontSize: 14,
              }}
            />
            <small style={{ color: '#718096', fontSize: 12 }}>
              Cantidad de pastillas a procesar (máx: {dosing.wheelDivisions})
            </small>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 32,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#2d3748',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Save size={16} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}