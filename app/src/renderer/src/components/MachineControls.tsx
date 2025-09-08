import React, { useState } from 'react'
import { useMachineCommands } from '../hooks/useMachineCommands'

interface MachineControlsProps {
  onSendCommand: (cmd: string) => Promise<void>
  simulationMode: boolean
  onSimulationModeChange?: (enabled: boolean) => void
}

export const MachineControls: React.FC<MachineControlsProps> = ({
  onSendCommand,
  simulationMode: initialSimMode,
  onSimulationModeChange,
}) => {
  const [simulationMode, setSimulationMode] = useState(initialSimMode)
  const commands = useMachineCommands(onSendCommand)

  const handleSimulationToggle = () => {
    const newMode = !simulationMode
    setSimulationMode(newMode)
    commands.setSimulationMode(newMode)
    onSimulationModeChange?.(newMode)
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(26, 26, 26, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Main Control Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <ControlButton onClick={commands.start} color="#4ade80" label="Start" icon="▶" />
        <ControlButton onClick={commands.pause} color="#fbbf24" label="Pause" icon="⏸" />
        <ControlButton onClick={commands.stop} color="#f87171" label="Stop" icon="⏹" />
        <ControlButton onClick={commands.reset} color="#60a5fa" label="Reset" icon="↺" />
      </div>

      <div style={{ width: 1, height: 32, background: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Secondary Controls */}
      <div style={{ display: 'flex', gap: 8 }}>
        <SecondaryButton onClick={commands.tare} label="Tare" />
        <SecondaryButton onClick={commands.elevatorUp} label="↑ Up" />
        <SecondaryButton onClick={commands.elevatorDown} label="↓ Down" />
      </div>

      <div style={{ width: 1, height: 32, background: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Simulation Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: '#9ca3af' }}>Simulation</span>
        <button
          onClick={handleSimulationToggle}
          style={{
            position: 'relative',
            width: 48,
            height: 26,
            borderRadius: 13,
            background: simulationMode ? '#7c3aed' : '#374151',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'background 0.3s',
            padding: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: 3,
              left: simulationMode ? 25 : 3,
              width: 20,
              height: 20,
              borderRadius: 10,
              background: 'white',
              transition: 'left 0.3s',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
        </button>
      </div>
    </div>
  )
}

interface ControlButtonProps {
  onClick: () => void
  color: string
  label: string
  icon: string
}

const ControlButton: React.FC<ControlButtonProps> = ({ onClick, color, label, icon }) => {
  const [isHovered, setIsHovered] = React.useState(false)
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 20px',
        background: isHovered ? color : '#2d3748',
        color: '#e2e8f0',
        border: `1px solid ${isHovered ? color : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
        transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  )
}

interface SecondaryButtonProps {
  onClick: () => void
  label: string
}

const SecondaryButton: React.FC<SecondaryButtonProps> = ({ onClick, label }) => {
  const [isHovered, setIsHovered] = React.useState(false)
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 16px',
        background: isHovered ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        color: isHovered ? '#ffffff' : '#9ca3af',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  )
}