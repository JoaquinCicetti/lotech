import { useCallback, useEffect, useState } from 'react'
import { ConnectionScreen } from './components/ConnectionScreen'
import { ConsoleOverlay } from './components/ConsoleOverlay'
import { ControlPanel } from './components/ControlPanel'
import { Dashboard3D } from './components/Dashboard3D'
import { Header } from './components/Header'
import { ProcessStepper } from './components/ProcessStepper'
import { DelaySettings, DosingSettings, Settings, ViewSettings } from './components/Settings'
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
  const [currentDosing, setCurrentDosing] = useState<DosingSettings | undefined>()
  const [currentView, setCurrentView] = useState<ViewSettings>({ viewMode: 'standard' })

  useEffect(() => {
    // Load available serial ports
    window.serial.list().then(setPorts)

    // Load settings from localStorage
    const savedDelays = localStorage.getItem('delaySettings')
    if (savedDelays) {
      setCurrentDelays(JSON.parse(savedDelays))
    }

    const savedDosing = localStorage.getItem('dosingSettings')
    if (savedDosing) {
      setCurrentDosing(JSON.parse(savedDosing))
    }

    const savedView = localStorage.getItem('viewSettings')
    if (savedView) {
      setCurrentView(JSON.parse(savedView))
    }

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
        const newDelays = {
          settle: delays.settle || 1500,
          weight: delays.weight || 2000,
          transfer: delays.transfer || 1200,
          grind: delays.grind || 5000,
          cap: delays.cap || 2500,
          elevUp: delays.up || 4000,
          elevDown: delays.down || 4000,
        }
        setCurrentDelays(newDelays)
        // Save to localStorage
        localStorage.setItem('delaySettings', JSON.stringify(newDelays))
        return
      }

      // Check if it's a dosing response
      const dosing = SerialMessageParser.parseDosing(line)
      if (dosing) {
        const newDosing = {
          wheelDivisions: dosing.divisions || 20,
          lotSize: dosing.lot_size || 10,
        }
        setCurrentDosing(newDosing)
        // Save to localStorage
        localStorage.setItem('dosingSettings', JSON.stringify(newDosing))
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
      // Send saved settings to controller if they exist
      const savedDosing = localStorage.getItem('dosingSettings')
      if (savedDosing) {
        const dosing = JSON.parse(savedDosing)
        await sendCommand(`SET:DIVISIONS:${dosing.wheelDivisions}`)
        await sendCommand(`SET:LOT_SIZE:${dosing.lotSize}`)
      }

      // Request current state from controller
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

  const fetchDosing = useCallback(async (): Promise<void> => {
    if (!selected) return
    await window.serial.write({ path: selected, data: 'GET:DOSING\r\n' })
  }, [selected])

  const saveSettings = useCallback(
    async (delays: DelaySettings, dosing: DosingSettings, view: ViewSettings): Promise<void> => {
      if (!selected) return

      // Send delay configuration commands
      const delayCommands = [
        `SET:DELAY:SETTLE:${delays.settle}`,
        `SET:DELAY:WEIGHT:${delays.weight}`,
        `SET:DELAY:TRANSFER:${delays.transfer}`,
        `SET:DELAY:GRIND:${delays.grind}`,
        `SET:DELAY:CAP:${delays.cap}`,
        `SET:DELAY:UP:${delays.elevUp}`,
        `SET:DELAY:DOWN:${delays.elevDown}`,
      ]

      // Send dosing configuration commands
      const dosingCommands = [
        `SET:DIVISIONS:${dosing.wheelDivisions}`,
        `SET:LOT_SIZE:${dosing.lotSize}`,
      ]

      // Send all commands
      for (const cmd of [...delayCommands, ...dosingCommands]) {
        await window.serial.write({ path: selected, data: `${cmd}\r\n` })
      }

      // Update local state and save to localStorage
      setCurrentDelays(delays)
      setCurrentDosing(dosing)
      setCurrentView(view)
      localStorage.setItem('delaySettings', JSON.stringify(delays))
      localStorage.setItem('dosingSettings', JSON.stringify(dosing))
      localStorage.setItem('viewSettings', JSON.stringify(view))
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

        {currentView.viewMode === '3d' ? (
          <Dashboard3D systemStatus={systemStatus} onSendCommand={sendCommand} />
        ) : (
          <>
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
          </>
        )}

        <ConsoleOverlay serialData={serialData} isVisible={showConsole} />

        <Settings
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onSave={saveSettings}
          onFetchDelays={fetchDelays}
          onFetchDosing={fetchDosing}
          currentDelays={currentDelays}
          currentDosing={currentDosing}
          currentView={currentView}
        />
      </div>
    </div>
  )
}

export default App
