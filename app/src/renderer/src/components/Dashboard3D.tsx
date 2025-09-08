import React, { useEffect } from 'react'
import { useAppStore } from '../store/appStore'
import { MachineState, SystemStatus } from '../types'
import { Scene3D } from './3d/Scene3D'
import { StatusCard } from './StatusCard'

interface Dashboard3DProps {
  systemStatus: SystemStatus
  onSendCommand: (cmd: string) => Promise<void>
}

export const Dashboard3D: React.FC<Dashboard3DProps> = (props) => {
  const { systemStatus, onSendCommand } = props
  const store = useAppStore()

  // Sync with app state
  useEffect(() => {
    const isConnected = systemStatus.state !== MachineState.INICIO
    if (store.isConnected !== isConnected) {
      store.setConnected(isConnected)
    }

    if (store.machineState !== systemStatus.state) {
      store.setMachineState(systemStatus.state)
    }

    // Simulate some load cell readings based on weight
    if (systemStatus?.weight ?? 0 > 0) {
      const baseWeight = (systemStatus?.weight ?? 0) / 9

      for (let i = 0; i < 9; i++) {
        store.setLoadCellReading(i, Math.random() * baseWeight * 2)
      }
    }
  }, [systemStatus.state, systemStatus.weight, store])

  const { isConnected, machineState, loadCellReadings } = store

  return (
    <div className="relative h-full w-full">
      {/* 3D Scene */}
      <Scene3D systemStatus={systemStatus} onSendCommand={onSendCommand} />

      {/* Status Panel - Floating and separated from model */}
      <StatusCard
        state={machineState}
        pillCount={systemStatus.pillCount}
        targetPills={systemStatus.targetPills}
        weight={systemStatus.weight ?? 0}
        isConnected={isConnected}
        loadCellCount={loadCellReadings.filter((w) => w > 0).length}
        position="floating"
        className="absolute top-20 left-20"
      />
    </div>
  )
}
