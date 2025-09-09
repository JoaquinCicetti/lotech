import React, { useState, useRef, useEffect } from 'react'
import { SerialMessageParser } from '../utils/serialParser'
import { ScrollArea } from './ui/scroll-area'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Send } from 'lucide-react'

interface ConsoleProps {
  serialData: string[]
  onSendCommand?: (command: string) => void
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
  const { serialData, onSendCommand } = props
  const [command, setCommand] = useState('')
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new data arrives
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [serialData])

  const handleSendCommand = () => {
    if (command.trim() && onSendCommand) {
      // Add to serial data display
      onSendCommand(command.trim())
      
      // Add to history
      setCommandHistory(prev => [...prev, command.trim()])
      setHistoryIndex(-1)
      
      // Clear input
      setCommand('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendCommand()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand('')
      }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {serialData.map((line, index) => (
          <ConsoleLine key={index} line={line} index={index} />
        ))}
      </ScrollArea>
      
      {onSendCommand && (
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter command (e.g., STATUS, GET:DELAYS, SET:DELAY:SETTLE:1500)"
              className="flex-1 font-mono text-xs"
            />
            <Button
              onClick={handleSendCommand}
              size="sm"
              disabled={!command.trim()}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Use ↑↓ for command history • Enter to send
          </div>
        </div>
      )}
    </div>
  )
}
