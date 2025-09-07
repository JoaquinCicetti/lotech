import { useCallback, useEffect, useState } from 'react'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Console } from './components/Console'
import { ControlPanel } from './components/ControlPanel'
import { Header } from './components/Header'
import { ProcessStepper } from './components/ProcessStepper'
import { DelaySettings, Settings } from './components/Settings'
import { SerialPortInfo, SystemStatus } from './types'
import { SerialMessageParser } from './utils/serialParser'

const INITIAL_STATUS: SystemStatus = {
  state: '0_INICIO',
  pillCount: 0,
  targetPills: 20,
  weight: 0,
  sensors: {
    posAlta: false,
    posBaja: true,
    weightStable: false,
    frascoVacio: true,
    pastillasCargadas: true,
  },
}

function App(): React.JSX.Element {
  const [ports, setPorts] = useState<SerialPortInfo[]>([])
  const [selected, setSelected] = useState<string>('')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [serialData, setSerialData] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [simulationMode, setSimulationMode] = useState<boolean>(true)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(INITIAL_STATUS)
  const [currentDelays, setCurrentDelays] = useState<DelaySettings | undefined>()

  useEffect(() => {
    // Load available serial ports
    window.serial.list().then(setPorts)

    // Set up serial data listener
    window.serial.onData(({ path, line }) => {
      console.log(`[${path}] ${line}`)

      // Update serial console
      setSerialData((prev) => {
        const newData = [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]
        return newData.slice(-100) // Keep last 100 lines
      })

      // Check if it's a delays response
      const delays = SerialMessageParser.parseDelays(line)
      if (delays) {
        setCurrentDelays({
          settle: delays.settle || 1500,
          weight: delays.weight || 2000,
          transfer: delays.transfer || 1200,
          grind: delays.grind || 5000,
          cap: delays.cap || 2500,
          elevUp: delays.up || 4000,
          elevDown: delays.down || 4000,
        })
        return
      }

      // Parse the message and update system status
      setSystemStatus((currentStatus) => {
        const update = SerialMessageParser.parseMessage(line, currentStatus)
        if (update) {
          return { ...currentStatus, ...update }
        }
        return currentStatus
      })
    })
  }, [])

  const connect = async (): Promise<void> => {
    if (!selected) return
    const success = await window.serial.open({ path: selected, baudRate: 9600 })
    setIsConnected(success)
    if (success) {
      await sendCommand('STATUS')
    }
  }

  const disconnect = async (): Promise<void> => {
    if (!selected) return
    await window.serial.close(selected)
    setIsConnected(false)
    setSerialData([])
    setSystemStatus(INITIAL_STATUS)
  }

  const sendCommand = async (cmd: string): Promise<void> => {
    if (!selected || !cmd) return
    await window.serial.write({ path: selected, data: `${cmd}\r\n` })
  }

  const toggleSensor = async (sensor: string, value: boolean): Promise<void> => {
    await sendCommand(`SIM:${sensor}:${value ? '1' : '0'}`)
  }

  const toggleSimulationMode = async (): Promise<void> => {
    const newMode = !simulationMode
    setSimulationMode(newMode)
    await sendCommand(newMode ? 'MODE:SIM' : 'MODE:REAL')
  }

  const fetchDelays = useCallback(async (): Promise<void> => {
    if (!selected) return
    await window.serial.write({ path: selected, data: 'GET:DELAYS\r\n' })
  }, [selected])

  const saveDelays = useCallback(
    async (settings: DelaySettings): Promise<void> => {
      if (!selected) return
      // Send all delay configuration commands
      const commands = [
        `SET:DELAY:SETTLE:${settings.settle}`,
        `SET:DELAY:WEIGHT:${settings.weight}`,
        `SET:DELAY:TRANSFER:${settings.transfer}`,
        `SET:DELAY:GRIND:${settings.grind}`,
        `SET:DELAY:CAP:${settings.cap}`,
        `SET:DELAY:UP:${settings.elevUp}`,
        `SET:DELAY:DOWN:${settings.elevDown}`,
      ]
      
      for (const cmd of commands) {
        await window.serial.write({ path: selected, data: `${cmd}\r\n` })
      }
      
      // Update local state
      setCurrentDelays(settings)
    },
    [selected]
  )

  // Show connection screen if not connected
  if (!isConnected) {
    return (
      <ConnectionScreen
        ports={ports}
        selected={selected}
        onSelectPort={setSelected}
        onConnect={connect}
      />
    )
  }

  // Main application UI
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: '#0f0f0f',
        color: '#e2e8f0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '80px 60px',
      }}
    >
      <div style={{ margin: '0 auto' }}>
        <Header
          simulationMode={simulationMode}
          showConsole={showConsole}
          onToggleSimulation={toggleSimulationMode}
          onToggleConsole={() => setShowConsole(!showConsole)}
          onOpenSettings={() => setShowSettings(true)}
          onDisconnect={disconnect}
        />

        <ProcessStepper
          currentState={systemStatus.state}
          pillCount={systemStatus.pillCount}
          targetPills={systemStatus.targetPills}
          stateProgress={systemStatus.stateProgress}
        />

        <ControlPanel
          systemStatus={systemStatus}
          simulationMode={simulationMode}
          onSendCommand={sendCommand}
          onToggleSensor={toggleSensor}
          onUpdateStatus={(update) => setSystemStatus((prev) => ({ ...prev, ...update }))}
        />

        {showConsole && <Console serialData={serialData} />}
        
        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={saveDelays}
          onFetchDelays={fetchDelays}
          currentDelays={currentDelays}
        />
      </div>
    </div>
  )
}

export default App
