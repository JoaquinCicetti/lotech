import React, { useEffect, useState } from 'react'
import { SerialPortInfo } from '../types'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
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

const AUTOCONNECT_PORT_KEY = 'lotech_autoconnect_port'
const AUTOCONNECT_ENABLED_KEY = 'lotech_autoconnect_enabled'

export const ConnectionScreen: React.FC<ConnectionScreenProps> = (props) => {
  const { ports, selected, onSelectPort, onConnect, error } = props

  const [autoConnect, setAutoConnect] = useState(() => {
    return localStorage.getItem(AUTOCONNECT_ENABLED_KEY) === 'true'
  })

  const [hasAttemptedAutoConnect, setHasAttemptedAutoConnect] = useState(false)

  // Auto-select and auto-connect to saved port, or find common Arduino port
  useEffect(() => {
    if (!selected && ports.length > 0) {
      // First, try to find the saved autoconnect port
      const autoConnectPortPath = localStorage.getItem(AUTOCONNECT_PORT_KEY)
      const autoConnectEnabled = localStorage.getItem(AUTOCONNECT_ENABLED_KEY) === 'true'

      if (autoConnectEnabled && autoConnectPortPath) {
        const savedPort = ports.find((p) => p.path === autoConnectPortPath)
        if (savedPort) {
          onSelectPort(savedPort.path)
          // Auto-connect will happen in separate effect below
          return
        }
      }

      // If no saved port or autoconnect disabled, try to find an Arduino Mega or common USB serial port
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

  // Auto-connect effect - triggers when port is selected and autoconnect is enabled
  useEffect(() => {
    const autoConnectEnabled = localStorage.getItem(AUTOCONNECT_ENABLED_KEY) === 'true'
    const autoConnectPortPath = localStorage.getItem(AUTOCONNECT_PORT_KEY)

    if (
      autoConnectEnabled &&
      autoConnectPortPath &&
      selected === autoConnectPortPath &&
      !hasAttemptedAutoConnect
    ) {
      setHasAttemptedAutoConnect(true)
      // Small delay to ensure port is ready
      setTimeout(() => {
        onConnect()
      }, 500)
    }
  }, [selected, hasAttemptedAutoConnect, onConnect])

  // Update localStorage when autoconnect checkbox changes
  useEffect(() => {
    if (autoConnect && selected) {
      localStorage.setItem(AUTOCONNECT_PORT_KEY, selected)
      localStorage.setItem(AUTOCONNECT_ENABLED_KEY, 'true')
    } else if (!autoConnect) {
      localStorage.removeItem(AUTOCONNECT_PORT_KEY)
      localStorage.removeItem(AUTOCONNECT_ENABLED_KEY)
    }
  }, [autoConnect, selected])

  return (
    <div className="from-background to-muted flex min-h-screen w-screen items-center justify-center bg-gradient-to-br">
      <Card className="border-border mx-4 w-full max-w-md">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex justify-center">
            <svg
              className="h-48 w-auto"
              viewBox="0 0 344.01 209.96"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <style>
                  {`
                    .cls-6 {
                      font-family: Orbitron, 'SF Pro Display', -apple-system, system-ui, sans-serif;
                      font-size: 15.3px;
                      font-weight: 300;
                      fill: #2fa4dd;
                    }
                    .cls-7 { fill: #2fa4dd; }
                    .cls-12 {
                      fill: #b5dfeb;
                      opacity: 0.45;
                    }
                  `}
                </style>
              </defs>
              <g>
                <g>
                  <g>
                    <ellipse className="cls-12" cx="104.17" cy="26.09" rx="15.25" ry="26.09" />
                    <path
                      className="cls-12"
                      d="M72.97,56.26c-4.63,0-12.19-4.44-17.82-14.19-3.08-5.34-4.84-11.23-4.81-16.15.02-4.14,1.29-7.24,3.48-8.5.82-.47,1.78-.71,2.87-.71,4.63,0,12.19,4.44,17.82,14.19,3.08,5.34,4.84,11.23,4.81,16.15-.02,4.14-1.29,7.24-3.48,8.5-.82.47-1.78.71-2.87.71Z"
                    />
                    <path
                      className="cls-12"
                      d="M46.71,76.66c-4.21,0-9.31-1.56-14.01-4.27-4.73-2.73-8.65-6.4-10.74-10.07-1.52-2.66-1.58-4.48-1.25-5.05.34-.58,1.96-1.44,5.08-1.44,4.21,0,9.31,1.55,14.01,4.27,9.67,5.58,13.08,13.24,11.99,15.12-.34.58-1.96,1.44-5.08,1.44Z"
                    />
                    <ellipse className="cls-12" cx="26.09" cy="105.8" rx="26.09" ry="15.25" />
                    <path
                      className="cls-12"
                      d="M26.61,159.62c-4.2,0-7.33-1.27-8.61-3.48-2.64-4.58,2.25-14.2,13.48-20.69,5.38-3.1,11.07-4.81,16.05-4.81,4.2,0,7.33,1.27,8.61,3.48,1.26,2.19.81,5.51-1.24,9.1-2.44,4.28-6.9,8.5-12.24,11.58-5.37,3.1-11.07,4.81-16.05,4.81Z"
                    />
                    <path
                      className="cls-12"
                      d="M58.1,189.42c-.54,0-.76-.13-.83-.17-1.88-1.08-2.76-9.42,2.82-19.09,4.84-8.39,11.27-12.16,14.29-12.16.54,0,.76.13.83.17,1.88,1.08,2.76,9.42-2.82,19.09-4.84,8.39-11.27,12.16-14.29,12.16Z"
                    />
                    <ellipse className="cls-12" cx="105.8" cy="183.87" rx="15.25" ry="26.09" />
                    <path
                      className="cls-12"
                      d="M153.28,192.67c-4.64,0-12.19-4.44-17.82-14.19-3.08-5.34-4.84-11.23-4.81-16.15.02-4.14,1.29-7.24,3.48-8.5.82-.47,1.78-.71,2.87-.71,4.63,0,12.19,4.44,17.82,14.19,6.49,11.24,5.91,22.01,1.33,24.66-.82.47-1.78.71-2.87.71Z"
                    />
                    <path
                      className="cls-12"
                      d="M135.58,51.96c-.54,0-.76-.13-.83-.17-1.88-1.08-2.76-9.42,2.82-19.09,4.84-8.39,11.27-12.16,14.29-12.16.54,0,.76.13.83.17,1.88,1.08,2.76,9.42-2.82,19.09-4.84,8.39-11.27,12.16-14.29,12.16Z"
                    />
                    <path
                      className="cls-12"
                      d="M182.59,154.13c-4.21,0-9.31-1.55-14.01-4.27-9.67-5.58-13.08-13.24-11.99-15.12.34-.58,1.96-1.44,5.08-1.44,4.21,0,9.31,1.56,14.01,4.27,4.73,2.73,8.65,6.4,10.74,10.07,1.52,2.66,1.58,4.48,1.25,5.05-.34.58-1.96,1.44-5.08,1.44Z"
                    />
                    <ellipse className="cls-12" cx="183.87" cy="104.17" rx="26.09" ry="15.25" />
                    <path
                      className="cls-12"
                      d="M162.43,79.32c-4.2,0-7.33-1.27-8.61-3.48-1.26-2.19-.81-5.51,1.24-9.1,2.44-4.28,6.9-8.5,12.24-11.58,5.37-3.1,11.07-4.81,16.05-4.81,4.2,0,7.33,1.27,8.61,3.48,1.26,2.19.81,5.51-1.24,9.1-2.44,4.28-6.9,8.5-12.24,11.58-5.38,3.1-11.07,4.81-16.05,4.81Z"
                    />
                  </g>
                  <g>
                    <path
                      className="cls-7"
                      d="M82.1,65.06h8.55v48.55h48.48v8.55h-57.03v-57.11Z"
                    />
                    <path
                      className="cls-7"
                      d="M205.02,84.78v27.09c0,.95.79,1.74,1.74,1.74h17.11v8.55h-17.11c-5.7,0-10.3-4.59-10.3-10.3v-50.69h8.55v15.05h18.85v8.55h-18.85Z"
                    />
                    <path
                      className="cls-7"
                      d="M275.6,86.52v16.95h-38.18v8.4c0,.95.79,1.74,1.74,1.74h36.44v8.55h-36.44c-5.7,0-10.3-4.59-10.3-10.3v-25.35c0-5.7,4.59-10.3,10.3-10.3h26.14c5.7,0,10.3,4.59,10.3,10.3ZM267.04,94.92v-8.4c0-.95-.79-1.74-1.74-1.74h-26.14c-.95,0-1.74.79-1.74,1.74v8.4h29.62Z"
                    />
                    <path
                      className="cls-7"
                      d="M329.69,113.61v8.55h-36.44c-5.7,0-10.3-4.59-10.3-10.3v-25.35c0-5.7,4.59-10.3,10.3-10.3h36.28v8.55h-36.28c-.95,0-1.74.79-1.74,1.74v25.35c0,.95.79,1.74,1.74,1.74h36.44Z"
                    />
                    <path
                      className="cls-7"
                      d="M179.87,76.29c5.7,0,10.3,4.59,10.3,10.3v25.35c0,5.7-4.59,10.3-10.3,10.3h-26.14c-5.7,0-10.3-4.59-10.3-10.3v-25.35c0-5.7,4.59-10.3,10.3-10.3h26.14ZM153.73,84.84c-.95,0-1.74.79-1.74,1.74v25.35c0,.95.79,1.74,1.74,1.74h26.14c.95,0,1.74-.79,1.74-1.74v-25.35c0-.95-.79-1.74-1.74-1.74h-26.14Z"
                    />
                  </g>
                </g>
                <text className="cls-6" transform="translate(81.3 146.41)">
                  <tspan x="0" y="0">
                    control de calidad de pastillas
                  </tspan>
                </text>
              </g>
            </svg>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="autoconnect-port"
                checked={autoConnect}
                onCheckedChange={(checked) => setAutoConnect(checked === true)}
              />
              <Label
                htmlFor="autoconnect-port"
                className="text-muted-foreground cursor-pointer text-sm font-normal"
              >
                Conectar automáticamente
              </Label>
            </div>
          </div>

          <Button onClick={onConnect} disabled={!selected} className="w-full" size="lg">
            Conectar
          </Button>

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        </CardContent>
      </Card>
    </div>
  )
}
