import React from 'react'
import { SerialMessageParser } from '../utils/serialParser'

interface ConsoleProps {
  serialData: string[]
}

export const Console: React.FC<ConsoleProps> = ({ serialData }) => {
  const getMessageColor = (line: string): string => {
    const type = SerialMessageParser.getMessageType(line)
    switch (type) {
      case 'error':
        return '#ef4444'
      case 'warning':
        return '#f59e0b'
      case 'success':
        return '#34d399'
      case 'debug':
        return '#4b5563'
      default:
        return '#9ca3af'
    }
  }

  return (
    <div
      style={{
        background: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        height: 300,
        overflowY: 'auto',
        fontFamily: 'monospace',
        fontSize: 11,
        border: '1px solid #2d3748',
      }}
    >
      {serialData.map((line, i) => (
        <div
          key={i}
          style={{
            color: getMessageColor(line),
            padding: '2px 0',
          }}
        >
          {line}
        </div>
      ))}
    </div>
  )
}
