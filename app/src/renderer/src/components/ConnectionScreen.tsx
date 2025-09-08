import { Pill } from 'lucide-react'
import React, { useEffect } from 'react'
import { SerialPortInfo } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface ConnectionScreenProps {
  ports: SerialPortInfo[]
  selected: string
  onSelectPort: (port: string) => void
  onConnect: () => void
  error?: string | null
}

const COMMON_PORT_PATTERNS = [
  'usbserial',
  'usbmodem',
  'COM3',
  'COM4',
  'COM5',
  'ttyUSB',
  'ttyACM',
  'Arduino',
  'MEGA',
] as const

export const ConnectionScreen: React.FC<ConnectionScreenProps> = (props) => {
  const { ports, selected, onSelectPort, onConnect, error } = props

  // Auto-select common Arduino port on mount
  useEffect(() => {
    if (!selected && ports.length > 0) {
      // Try to find an Arduino Mega or common USB serial port
      const arduinoPort = ports.find((p) => {
        const portStr = (p.friendlyName || p.path).toLowerCase()
        return COMMON_PORT_PATTERNS.some((pattern) => portStr.includes(pattern.toLowerCase()))
      })

      if (arduinoPort) {
        onSelectPort(arduinoPort.path)
      } else if (ports.length === 1) {
        // If only one port available, auto-select it
        onSelectPort(ports[0].path)
      }
    }
  }, [ports, selected, onSelectPort])

  return (
    <div className="from-background to-muted flex min-h-screen w-screen items-center justify-center bg-gradient-to-br">
      <Card className="border-border mx-4 w-full max-w-md">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex justify-center">
            <Pill className="text-primary h-12 w-12" />
          </div>
          <CardTitle className="text-3xl font-light">LOTECH</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selected} onValueChange={onSelectPort}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar puerto..." />
            </SelectTrigger>
            <SelectContent>
              {ports.map((port) => (
                <SelectItem key={port.path} value={port.path}>
                  {port.friendlyName ?? port.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={onConnect} disabled={!selected} className="w-full" size="lg">
            Conectar
          </Button>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
