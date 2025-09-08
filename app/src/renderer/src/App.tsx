import { useEffect, useState } from 'react'
import { CommandPanel } from './components/CommandPanel'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Console } from './components/Console'
import { Dashboard3D } from './components/Dashboard3D'
import { Layout } from './components/Layout'
import { LeftSidebar } from './components/LeftSidebar'
import { ProcessStepper } from './components/ProcessStepper'
import { useAppStore } from './store/appStore'
import { SerialMessageParser } from './utils/serialParser'

function App(): React.JSX.Element {
  const {
    ports,
    selectedPort,
    isConnected,
    serialData,
    showConsole,
    systemStatus,
    currentView,
    connectionError,
    setPorts,
    setSelectedPort,
    setConnected,
    setConnectionError,
    setLastMessageTime,
    addSerialData,
    clearSerialData,
    updateSystemStatus,
    setShowConsole,
    setCurrentDelays,
    setCurrentDosing,
  } = useAppStore()

  const [showSettings, setShowSettings] = useState<boolean>(false)

  useEffect(() => {
    // Keyboard shortcut for console (Ctrl/Cmd + `)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const store = useAppStore.getState()
        setShowConsole(!store.showConsole)
      }
    }
    window.addEventListener('keydown', handleKeyDown)

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

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setPorts, setCurrentDelays, setCurrentDosing, setShowConsole])

  useEffect(() => {
    // Set up serial data listener
    const handleData = ({ path, line }: { path: string; line: string }) => {
      console.log(`[${path}] ${line}`)

      // Update last message time
      setLastMessageTime(Date.now())
      setConnectionError(null)

      // Update serial console
      addSerialData(line)

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
      const store = useAppStore.getState()
      try {
        const update = SerialMessageParser.parseMessage(line, store.systemStatus)
        if (update) {
          updateSystemStatus(update)
        }
      } catch (error) {
        console.error('Error parsing message:', error, 'Line:', line)
      }
    }

    const handleError = ({ path, error }: { path: string; error: string }) => {
      console.error(`Serial error on ${path}:`, error)
      setConnectionError(error)
      addSerialData(`ERROR: ${error}`)
    }

    window.serial.onData(handleData)
    window.serial.onError(handleError)

    // Monitor connection health
    const healthCheckInterval = setInterval(() => {
      const store = useAppStore.getState()
      if (store.isConnected) {
        const timeSinceLastMessage = Date.now() - store.lastMessageTime
        if (timeSinceLastMessage > 5000) {
          setConnectionError('No data received for 5 seconds')
        }
      }
    }, 1000)

    return () => {
      clearInterval(healthCheckInterval)
    }
  }, [
    setLastMessageTime,
    setConnectionError,
    addSerialData,
    setCurrentDelays,
    setCurrentDosing,
    updateSystemStatus,
  ])

  const connect = async (): Promise<void> => {
    if (!selectedPort) return
    try {
      const success = await window.serial.open({ path: selectedPort, baudRate: 9600 })

      setConnected(success)
      setConnectionError(null)
      setLastMessageTime(Date.now())

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
    } catch (error) {
      console.error('Failed to connect:', error)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      setConnected(false)
    }
  }

  const disconnect = async (): Promise<void> => {
    if (!selectedPort) return
    try {
      await window.serial.close(selectedPort)
      setConnected(false)
      clearSerialData()
      setConnectionError(null)
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  const sendCommand = async (cmd: string): Promise<void> => {
    if (!selectedPort || !cmd) return
    await window.serial.write({ path: selectedPort, data: `${cmd}\r\n` })
  }

  // Show connection screen if not connected
  if (!isConnected) {
    return (
      <ConnectionScreen
        ports={ports}
        selected={selectedPort}
        onSelectPort={setSelectedPort}
        onConnect={connect}
        error={connectionError}
      />
    )
  }

  // Main application UI
  return (
    <Layout
      leftSidebar={<LeftSidebar onDisconnect={disconnect} onSendCommand={sendCommand} />}
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
      <div className="h-full items-center overflow-auto">
        {currentView === '3d' ? (
          <>
            <Dashboard3D systemStatus={systemStatus} onSendCommand={sendCommand} />
            <CommandPanel onSendCommand={sendCommand} floating />
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-6">
            <ProcessStepper
              currentState={systemStatus.state}
              stateProgress={systemStatus.stateProgress}
              pillCount={systemStatus.pillCount}
              targetPills={systemStatus.targetPills}
            />
            <CommandPanel onSendCommand={sendCommand} />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App
