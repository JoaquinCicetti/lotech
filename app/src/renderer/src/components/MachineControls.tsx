import { ChevronDown, ChevronUp, Pause, Play, RotateCcw, Scale, Square } from 'lucide-react'
import React, { useState } from 'react'
import { useMachineCommands } from '../hooks/useMachineCommands'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Label } from './ui/label'
import { Switch } from './ui/switch'

interface MachineControlsProps {
  onSendCommand: (cmd: string) => Promise<void>
  simulationMode: boolean
  onSimulationModeChange?: (enabled: boolean) => void
}

interface ControlButtonProps {
  onClick: () => void
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost'
  icon: React.ReactNode
  label: string
}

interface SecondaryButtonProps {
  onClick: () => void
  label: string
  icon?: React.ReactNode
}

const ControlButton: React.FC<ControlButtonProps> = (props) => {
  const { onClick, variant = 'default', icon, label } = props

  return (
    <Button onClick={onClick} variant={variant} size="default" className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </Button>
  )
}

const SecondaryButton: React.FC<SecondaryButtonProps> = (props) => {
  const { onClick, label, icon } = props

  return (
    <Button onClick={onClick} variant="outline" size="default" className="flex items-center gap-2">
      {icon}
      <span>{label}</span>
    </Button>
  )
}

export const MachineControls: React.FC<MachineControlsProps> = (props) => {
  const { onSendCommand, simulationMode: initialSimMode, onSimulationModeChange } = props

  const [simulationMode, setSimulationMode] = useState(initialSimMode)
  const commands = useMachineCommands(onSendCommand)

  const handleSimulationToggle = (checked: boolean) => {
    setSimulationMode(checked)
    commands.setSimulationMode(checked)
    onSimulationModeChange?.(checked)
  }

  return (
    <Card className="bg-background/95 border-border fixed bottom-6 left-1/2 -translate-x-1/2 p-4 backdrop-blur-md">
      <div className="flex items-center gap-5">
        {/* Main Control Buttons */}
        <div className="flex gap-2">
          <ControlButton
            onClick={commands.start}
            variant="default"
            icon={<Play className="h-4 w-4" />}
            label="Start"
          />
          <ControlButton
            onClick={commands.pause}
            variant="secondary"
            icon={<Pause className="h-4 w-4" />}
            label="Pause"
          />
          <ControlButton
            onClick={commands.stop}
            variant="destructive"
            icon={<Square className="h-4 w-4" />}
            label="Stop"
          />
          <ControlButton
            onClick={commands.reset}
            variant="outline"
            icon={<RotateCcw className="h-4 w-4" />}
            label="Reset"
          />
        </div>

        <div className="bg-border h-8 w-px" />

        {/* Secondary Controls */}
        <div className="flex gap-2">
          <SecondaryButton onClick={commands.tare} label="Tare" />
          <SecondaryButton
            onClick={commands.elevatorUp}
            label="Up"
            icon={<ChevronUp className="h-4 w-4" />}
          />
          <SecondaryButton
            onClick={commands.elevatorDown}
            label="Down"
            icon={<ChevronDown className="h-4 w-4" />}
          />
          <SecondaryButton
            onClick={commands.weightStable}
            label="Stable"
            icon={<Scale className="h-4 w-4" />}
          />
        </div>

        <div className="bg-border h-8 w-px" />

        {/* Simulation Toggle */}
        <div className="flex items-center gap-3">
          <Label htmlFor="simulation-mode" className="text-muted-foreground text-sm">
            Simulation
          </Label>
          <Switch
            id="simulation-mode"
            checked={simulationMode}
            onCheckedChange={handleSimulationToggle}
          />
        </div>
      </div>
    </Card>
  )
}
