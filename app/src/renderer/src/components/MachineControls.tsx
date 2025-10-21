import { ChevronDown, ChevronUp, Pause, Play, RotateCcw, Scale, Square } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useMachineCommands } from '../hooks/useMachineCommands'
import { type CycleData, usePillTrackingStore } from '../store/pillTrackingStore'
import { LotNumberDialog } from './LotNumberDialog'
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
  const [showLotDialog, setShowLotDialog] = useState(false)
  const commands = useMachineCommands(onSendCommand)
  const { startNewCycle, isTracking, currentCycle, endCycle, exportCycleData } =
    usePillTrackingStore()

  // Debug dialog state
  useEffect(() => {
    console.log('Lot dialog state changed:', showLotDialog)
  }, [showLotDialog])

  const handleSimulationToggle = (checked: boolean) => {
    setSimulationMode(checked)
    commands.setSimulationMode(checked)
    onSimulationModeChange?.(checked)
  }

  const handleStart = () => {
    console.log('Start button clicked - showing lot dialog')
    // Always show lot dialog when pressing start
    setShowLotDialog(true)
    // Do NOT send the start command here - wait for lot confirmation
  }

  const saveCycleData = async (cycle: CycleData) => {
    const csvContent = exportCycleData(cycle)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `lotech_${cycle.lotNumber}_${timestamp}.csv`

    try {
      const result = await window.file.saveDialog({
        content: csvContent,
        defaultFilename: filename,
      })

      if (result.success) {
        toast.success(`Datos del ciclo guardados en ${result.path}`)
        return true
      }
      return false
    } catch (error) {
      console.error('Error saving cycle:', error)
      toast.error('Error al guardar datos del ciclo')
      return false
    }
  }

  const handleLotConfirm = async (lotNumber: string) => {
    // If there's an existing cycle, offer to save it first
    if (isTracking && currentCycle && currentCycle.totalPills > 0) {
      // Automatically save the existing cycle data
      const completedCycle = endCycle()
      if (completedCycle) {
        await saveCycleData(completedCycle)
      }
    }

    // Start tracking with the new lot number
    startNewCycle(lotNumber)
    // Then start the machine
    commands.start()
    toast.success(`Nuevo ciclo iniciado para lote: ${lotNumber}`)
  }

  const handleStop = async () => {
    // Stop the machine
    commands.stop()

    // If tracking, end the cycle and prompt to save
    if (isTracking && currentCycle && currentCycle.totalPills > 0) {
      // Show save dialog for the current cycle
      const csvContent = exportCycleData(currentCycle)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `lotech_${currentCycle.lotNumber}_${timestamp}.csv`

      try {
        const result = await window.file.saveDialog({
          content: csvContent,
          defaultFilename: filename,
        })

        if (result.success) {
          // Only end the cycle if user saved the file
          endCycle()
          toast.success(`Ciclo finalizado y datos guardados en ${result.path}`)
        } else if (!result.canceled) {
          toast.error('Error al guardar datos del ciclo')
        } else {
          // User canceled save, keep the cycle active
          toast.info('Ciclo aún activo - datos no guardados')
        }
      } catch (error) {
        console.error('Error saving cycle:', error)
        toast.error('Error al guardar datos del ciclo')
      }
    }
  }

  return (
    <>
      <LotNumberDialog
        open={showLotDialog}
        onOpenChange={setShowLotDialog}
        onConfirm={handleLotConfirm}
      />

      <Card className="bg-background/95 border-border fixed bottom-6 left-1/2 -translate-x-1/2 p-4 backdrop-blur-md">
        <div className="flex items-center gap-5">
          {/* Main Control Buttons */}
          <div className="flex gap-2">
            <ControlButton
              onClick={handleStart}
              variant="default"
              icon={<Play className="h-4 w-4" />}
              label="Iniciar"
            />
            <ControlButton
              onClick={commands.pause}
              variant="secondary"
              icon={<Pause className="h-4 w-4" />}
              label="Pausar"
            />
            <ControlButton
              onClick={handleStop}
              variant="destructive"
              icon={<Square className="h-4 w-4" />}
              label="Detener"
            />
            <ControlButton
              onClick={commands.reset}
              variant="outline"
              icon={<RotateCcw className="h-4 w-4" />}
              label="Reiniciar"
            />
          </div>

          <div className="bg-border h-8 w-px" />

          {/* Secondary Controls */}
          <div className="flex gap-2">
            <SecondaryButton onClick={commands.tare} label="Tarar" />
            <SecondaryButton
              onClick={commands.elevatorUp}
              label="Subir"
              icon={<ChevronUp className="h-4 w-4" />}
            />
            <SecondaryButton
              onClick={commands.elevatorDown}
              label="Bajar"
              icon={<ChevronDown className="h-4 w-4" />}
            />
            <SecondaryButton
              onClick={commands.weightStable}
              label="Estable"
              icon={<Scale className="h-4 w-4" />}
            />
          </div>

          <div className="bg-border h-8 w-px" />

          {/* Simulation Toggle */}
          <div className="flex items-center gap-3">
            <Label htmlFor="simulation-mode" className="text-muted-foreground text-sm">
              Simulación
            </Label>
            <Switch
              id="simulation-mode"
              checked={simulationMode}
              onCheckedChange={handleSimulationToggle}
            />
          </div>
        </div>
      </Card>
    </>
  )
}
