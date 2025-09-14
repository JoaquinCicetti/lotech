import { useCallback, useEffect } from 'react'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Dashboard3D } from './components/Dashboard3D'
import { FloatingActionBar } from './components/FloatingActionBar'
import { Layout } from './components/Layout'
import { LeftSidebar } from './components/LeftSidebar'
import { ProcessStepper } from './components/ProcessStepper'
import { RightPanel } from './components/RightPanel'
import { useConnectionStore } from './store/connectionStore'
import { useControllerStateStore } from './store/controllerStateStore'
import { useSettingsStore } from './store/settingsStore'
import { useUIStore } from './store/uiStore'
import { SerialMessageParser } from './utils/serialParser'

function App(): React.JSX.Element {
  const {
    ports,
    selectedPort,
    isConnected,
    serialData,
    connectionError,
    setPorts,
    setSelectedPort,
    setConnected,
    setConnectionError,
    setLastMessageTime,
    addSerialData,
    clearSerialData,
  } = useConnectionStore()

  const { updateFromSystemStatus, machineState, setError } = useControllerStateStore()

  const { currentView, showSettings, setShowSettings } = useUIStore()

  const { setDelays, setDosing } = useSettingsStore()

  // Handle serial data
  useEffect(() => {
    const handleData = ({ path, line }: { path: string; line: string }) => {
      console.log(`[${path}] ${line}`)

      // Update connection health
      setLastMessageTime(Date.now())
      setConnectionError(null)
      addSerialData(line)

      // Parse delays
      const delays = SerialMessageParser.parseDelays(line)
      if (delays) {
        const newDelays = {
          settle: delays.settle ?? 0,
          weight: delays.weight ?? 0,
          transfer: delays.transfer ?? 0,
          grind: delays.grind ?? 0,
          cap: delays.cap ?? 0,
          elevUp: delays.elevup ?? delays.up ?? 0,
          elevDown: delays.elevdown ?? delays.down ?? 0,
        }
        setDelays(newDelays)
        return
      }

      // Parse dosing
      const dosing = SerialMessageParser.parseDosing(line)
      if (dosing) {
        const newDosing = {
          wheelDivisions: dosing.divisions ?? 0,
          lotSize: dosing.lot_size ?? 0,
        }
        setDosing(newDosing)
        return
      }

      // Parse system status
      try {
        const currentStatus = useControllerStateStore.getState()
        const statusUpdate = SerialMessageParser.parseMessage(line, {
          state: currentStatus.machineState,
          pillCount: currentStatus.pillCount,
          weight: currentStatus.currentWeight,
          sensors: currentStatus.sensorReadings,
          hardware: currentStatus.hardwareStatus,
        })

        if (statusUpdate) {
          updateFromSystemStatus(statusUpdate)
        }
      } catch (error) {
        console.error('Error parsing message:', error, 'Line:', line)
      }
    }

    const handleError = ({ path, error }: { path: string; error: string }) => {
      console.error(`Serial error on ${path}:`, error)
      setConnectionError(error)
      setError(error)
      addSerialData(`ERROR: ${error}`)
    }

    const removeDataListener = window.serial.onData(handleData)
    const removeErrorListener = window.serial.onError(handleError)

    // Connection health monitoring
    const healthCheckInterval = setInterval(() => {
      const { isConnected, lastMessageTime } = useConnectionStore.getState()
      if (isConnected) {
        const timeSinceLastMessage = Date.now() - lastMessageTime
        if (timeSinceLastMessage > 5000) {
          setConnectionError('No data received for 5 seconds')
        }
      }
    }, 1000)

    // Controller sends status updates automatically - no need to poll

    return () => {
      removeDataListener?.()
      removeErrorListener?.()
      clearInterval(healthCheckInterval)
    }
  }, [
    setLastMessageTime,
    setConnectionError,
    addSerialData,
    setDelays,
    setDosing,
    updateFromSystemStatus,
    setError,
  ])

  // Keyboard shortcuts
  // useEffect(() => {
  //   const handleKeyDown = (e: KeyboardEvent) => {
  //     if (e.key === '`' && (e.ctrlKey || e.metaKey)) {
  //       e.preventDefault()
  //       setShowConsole(!showConsole)
  //     }
  //   }
  //   window.addEventListener('keydown', handleKeyDown)
  //   return () => window.removeEventListener('keydown', handleKeyDown)
  // }, [showConsole, setShowConsole])

  // Load ports on mount
  useEffect(() => {
    window.serial.list().then(setPorts)
  }, [setPorts])

  const sendCommand = useCallback(
    async (cmd: string): Promise<void> => {
      if (!selectedPort || !cmd) return
      try {
        await window.serial.write({ path: selectedPort, data: cmd + '\n' })
        addSerialData(`> ${cmd}`)
      } catch (error) {
        console.error('Failed to send command:', error)
      }
    },
    [selectedPort, addSerialData]
  )

  const connect = async (): Promise<void> => {
    if (!selectedPort) return
    try {
      const success = await window.serial.open({ path: selectedPort, baudRate: 9600 })
      setConnected(success)
      setConnectionError(null)
      setLastMessageTime(Date.now())

      if (success) {
        // Wait for controller to be ready
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Request initial status
        await sendCommand('STATUS')
        await new Promise((resolve) => setTimeout(resolve, 100))
        await sendCommand('GET:DELAYS')
        await new Promise((resolve) => setTimeout(resolve, 100))
        await sendCommand('GET:DOSING')
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
    <>
      <Layout
        leftSidebar={<LeftSidebar onConnect={connect} onDisconnect={disconnect} />}
        rightSidebar={<RightPanel />}
        showLeftSidebar={showSettings}
        showRightSidebar={true}
        onToggleLeftSidebar={() => setShowSettings(!showSettings)}
        onToggleRightSidebar={() => setShowSettings(!showSettings)}
      >
        <div className="h-full items-center overflow-auto">
          {currentView === '3d' ? (
            <Dashboard3D
              systemStatus={{
                state: machineState,
                pillCount: useControllerStateStore.getState().pillCount,
                weight: useControllerStateStore.getState().currentWeight,
                sensors: useControllerStateStore.getState().sensorReadings,
                hardware: useControllerStateStore.getState().hardwareStatus,
              }}
              onSendCommand={sendCommand}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center space-y-6">
              <ProcessStepper
                currentState={machineState}
                stateProgress={useControllerStateStore.getState().stateProgress ?? undefined}
                pillCount={useControllerStateStore.getState().pillCount}
              />
            </div>
          )}
        </div>
      </Layout>
      <FloatingActionBar />
    </>
  )
}

export default App
