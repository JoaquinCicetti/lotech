import { useConnectionStore } from '@renderer/store/connectionStore'
import React from 'react'
import { Console } from './Console'

interface RightPanelProps {
  onSendCommand: (cmd: string) => void
}

export const RightPanel: React.FC<RightPanelProps> = (props) => {
  const { onSendCommand } = props
  const { serialData } = useConnectionStore()

  return (
    <div className="h-full p-2 pt-20">
      <Console serialData={serialData} onSendCommand={onSendCommand} />
    </div>
  )
}
