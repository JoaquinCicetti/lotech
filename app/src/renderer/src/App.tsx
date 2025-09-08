import { useCallback, useEffect, useState } from 'react'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Console } from './components/Console'
import { ControlPanel } from './components/ControlPanel'
import { Dashboard3D } from './components/Dashboard3D'
import { Layout } from './components/Layout'
import { LeftSidebar } from './components/LeftSidebar'
import { ProcessStepper } from './components/ProcessStepper'
import { DelaySettings, DosingSettings } from './components/Settings'
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
  const [currentView, setCurrentView] = useState<'3d' | 'dashboard'>('3d')

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
    async (delays: DelaySettings, dosing: DosingSettings): Promise<void> => {
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

      localStorage.setItem('delaySettings', JSON.stringify(delays))
      localStorage.setItem('dosingSettings', JSON.stringify(dosing))
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
    <Layout
      leftSidebar={
        <LeftSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          simulationMode={simulationMode}
          onSimulationModeChange={setSimulationMode}
          onDisconnect={disconnect}
          onSendCommand={sendCommand}
          currentDelays={currentDelays}
          currentDosing={currentDosing}
          onSaveSettings={saveSettings}
        />
      }
      rightSidebar={
        <div className="flex h-full flex-col">
          <div className="border-border border-b p-4">
            <h3 className="text-sm font-semibold">Serial Console</h3>
          </div>
          <div className="flex-1 overflow-hidden">
            <Console serialData={serialData} />
          </div>
        </div>
      }
      showLeftSidebar={showSettings}
      showRightSidebar={showConsole}
      onToggleLeftSidebar={() => setShowSettings(!showSettings)}
      onToggleRightSidebar={() => setShowConsole(!showConsole)}
    >
      <div className="h-full overflow-auto p-8">
        {currentView === '3d' ? (
          <Dashboard3D systemStatus={systemStatus} onSendCommand={sendCommand} />
        ) : (
          <div className="mx-auto max-w-6xl space-y-6 py-10">
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
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App
