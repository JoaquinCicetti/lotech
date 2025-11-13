import { useEffect } from 'react'
import { toast } from 'sonner'
import { ConnectionOverlay } from './components/ConnectionOverlay'
import { Dashboard3D } from './components/Dashboard3D'
import { EmergencyStopOverlay } from './components/EmergencyStopOverlay'
import { FloatingActionBar } from './components/FloatingActionBar'
import { Layout } from './components/Layout'
import { LeftSidebar } from './components/LeftSidebar'
import { RightPanel } from './components/RightPanel'
import { Toaster } from './components/ui/toaster'
import { useTheme } from './hooks/useTheme'
import { useSerialConnection } from './serial'
import { useConnectionStore } from './store/connectionStore'
import { useControllerStateStore } from './store/controllerStateStore'
import { usePillTrackingStore } from './store/pillTrackingStore'
import { useUIStore } from './store/uiStore'

// DEBUG: Uncomment to simulate elevator movement without hardware
// import { startElevatorSimulation } from './debug/elevatorSimulation'

function App(): React.JSX.Element {
  // Initialize theme
  useTheme()

  const { ports, selectedPort, setPorts, setSelectedPort } = useConnectionStore()
  const { machineState, pillCount, currentWeight, sensorReadings, hardwareStatus } =
    useControllerStateStore()
  const { showSettings, setShowSettings, showConsole, setShowConsole } = useUIStore()
  const { connect, disconnect, sendCommand, isConnected, connectionError } = useSerialConnection()
  const { recoverFromStorage } = usePillTrackingStore()

  // Wrap disconnect to close sidebar
  const handleDisconnect = async () => {
    await disconnect()
    setShowSettings(false)
  }

  // Auto-close sidebar when disconnected
  useEffect(() => {
    if (!isConnected && showSettings) {
      setShowSettings(false)
    }
  }, [isConnected, showSettings, setShowSettings])

  // useEffect(() => {
  //   startElevatorSimulation()
  // }, [])
  // Load ports on mount and check for recovered data
  useEffect(() => {
    window.serial.list().then(setPorts)

    // Check for recovered tracking data
    const checkRecoveredData = () => {
      const state = usePillTrackingStore.getState()
      if (state.currentCycle && !state.hasRecoveredData) {
        recoverFromStorage()
        toast.info(
          `Datos recuperados para el lote "${state.currentCycle.lotNumber}" con ${state.currentCycle.totalPills} píldoras`,
          { duration: 5000 }
        )
      }
    }

    // Small delay to ensure store is hydrated from localStorage
    setTimeout(checkRecoveredData, 100)
  }, [setPorts, recoverFromStorage])

  // Main application UI - Always show scene
  return (
    <>
      <Layout
        leftSidebar={<LeftSidebar onConnect={connect} onDisconnect={handleDisconnect} />}
        rightSidebar={<RightPanel onSendCommand={sendCommand} />}
        showLeftSidebar={showSettings}
        showRightSidebar={showConsole}
        onToggleLeftSidebar={() => setShowSettings(!showSettings)}
        onToggleRightSidebar={() => setShowConsole(!showConsole)}
        isConnected={isConnected}
      >
        <div className="h-full items-center overflow-auto">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              filter: isConnected ? 'blur(0px) brightness(1)' : 'blur(8px) brightness(0.65)',
              willChange: 'filter',
              transform: 'translateZ(0)',
            }}
          >
            <Dashboard3D
              systemStatus={{
                state: machineState,
                pillCount: pillCount,
                weight: currentWeight,
                sensors: sensorReadings,
                hardware: hardwareStatus,
              }}
              onSendCommand={sendCommand}
              isConnected={isConnected}
            />
          </div>

          {/* Connection overlay when not connected */}
          {!isConnected && (
            <ConnectionOverlay
              ports={ports}
              selected={selectedPort}
              onSelectPort={setSelectedPort}
              onConnect={connect}
              error={connectionError}
              isConnected={isConnected}
            />
          )}
        </div>
      </Layout>
      {isConnected && <FloatingActionBar />}
      {isConnected && <EmergencyStopOverlay />}
      <Toaster />
    </>
  )
}

export default App
