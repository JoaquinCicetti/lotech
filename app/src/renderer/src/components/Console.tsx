import React from 'react'
import { SerialMessageParser } from '../utils/serialParser'
import { ScrollArea } from './ui/scroll-area'

interface ConsoleProps {
  serialData: string[]
}

interface ConsoleLineProps {
  line: string
  index: number
}

const ConsoleLine: React.FC<ConsoleLineProps> = (props) => {
  const { line } = props

  const getMessageColor = (line: string): string => {
    const type = SerialMessageParser.getMessageType(line)
    switch (type) {
      case 'error':
        return 'text-destructive'
      case 'warning':
        return 'text-yellow-500'
      case 'success':
        return 'text-primary'
      case 'debug':
        return 'text-muted-foreground/60'
      default:
        return 'text-muted-foreground'
    }
  }

  return <div className={`py-0.5 font-mono text-xs ${getMessageColor(line)}`}>{line}</div>
}

export const Console: React.FC<ConsoleProps> = (props) => {
  const { serialData } = props

  return (
    <ScrollArea className="h-full p-4">
      {serialData.map((line, index) => (
        <ConsoleLine key={index} line={line} index={index} />
      ))}
    </ScrollArea>
  )
}
