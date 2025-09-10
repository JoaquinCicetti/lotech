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
      {/* 3D Scene */}
      <Scene3D systemStatus={systemStatus} />
    </div>
  )
}
