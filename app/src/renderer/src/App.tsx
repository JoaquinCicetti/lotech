import { useEffect } from 'react'
import { toast } from 'sonner'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Dashboard3D } from './components/Dashboard3D'
import { EmergencyStopOverlay } from './components/EmergencyStopOverlay'
import { FloatingActionBar } from './components/FloatingActionBar'
import { Layout } from './components/Layout'
import { LeftSidebar } from './components/LeftSidebar'
import { RightPanel } from './components/RightPanel'
import { Toaster } from './components/ui/toaster'
import { useSerialConnection } from './serial'
import { useConnectionStore } from './store/connectionStore'
import { useControllerStateStore } from './store/controllerStateStore'
import { usePillTrackingStore } from './store/pillTrackingStore'
import { useUIStore } from './store/uiStore'

function App(): React.JSX.Element {
  const { ports, selectedPort, setPorts, setSelectedPort } = useConnectionStore()
  const { machineState, pillCount, currentWeight, sensorReadings, hardwareStatus } =
    useControllerStateStore()
  const { showSettings, setShowSettings, showConsole, setShowConsole } = useUIStore()
  const { connect, disconnect, sendCommand, isConnected, connectionError } = useSerialConnection()
  const { recoverFromStorage } = usePillTrackingStore()

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
        showRightSidebar={showConsole}
        onToggleLeftSidebar={() => setShowSettings(!showSettings)}
        onToggleRightSidebar={() => setShowConsole(!showConsole)}
      >
        <div className="h-full items-center overflow-auto">
          <Dashboard3D
            systemStatus={{
              state: machineState,
              pillCount: pillCount,
              weight: currentWeight,
              sensors: sensorReadings,
              hardware: hardwareStatus,
            }}
            onSendCommand={sendCommand}
          />
        </div>
      </Layout>
      <FloatingActionBar />
      <EmergencyStopOverlay />
      <Toaster />
    </>
  )
}

export default App
