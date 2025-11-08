import React from 'react'
import { SystemStatus } from '../types'
import { Scene3D } from './3d/Scene3D'

interface Dashboard3DProps {
  systemStatus: SystemStatus
  onSendCommand: (cmd: string) => void
}

export const Dashboard3D: React.FC<Dashboard3DProps> = (props) => {
  const { systemStatus } = props

  return (
    <div className="relative h-full w-full">
      {/* 3D Scene with integrated floating cards */}
      <Scene3D systemStatus={systemStatus} />

      {/* 2D Overlay Cards - Hidden (now using 3D floating cards) */}
      {/* <div className="absolute top-6 right-6 z-10 flex flex-col gap-4">
        <WeightCard />
        <ElevatorPositionCard />
      </div> */}
    </div>
  )
}
