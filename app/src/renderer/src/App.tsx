import { useEffect } from 'react'
import { ConnectionScreen } from './components/ConnectionScreen'
import { Dashboard3D } from './components/Dashboard3D'
import { FloatingActionBar } from './components/FloatingActionBar'
import { Layout } from './components/Layout'
import { LeftSidebar } from './components/LeftSidebar'
import { ProcessStepper } from './components/ProcessStepper'
import { RightPanel } from './components/RightPanel'
import { SensorCards } from './components/SensorCards'
import { useSerialConnection } from './serial'
import { useConnectionStore } from './store/connectionStore'
import { useControllerStateStore } from './store/controllerStateStore'
import { useUIStore } from './store/uiStore'

function App(): React.JSX.Element {
  const { ports, selectedPort, setPorts, setSelectedPort } = useConnectionStore()
  const { machineState } = useControllerStateStore()
  const { currentView, showSettings, setShowSettings } = useUIStore()
  const { connect, disconnect, sendCommand, isConnected, connectionError } = useSerialConnection()

  // Load ports on mount
  useEffect(() => {
    window.serial.list().then(setPorts)
  }, [setPorts])

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
            <div className="flex h-full flex-col items-center justify-center space-y-6 overflow-auto p-6">
              <ProcessStepper
                currentState={machineState}
                stateProgress={useControllerStateStore.getState().stateProgress ?? undefined}
                pillCount={useControllerStateStore.getState().pillCount}
              />
              <SensorCards />
            </div>
          )}
        </div>
      </Layout>
      <FloatingActionBar />
    </>
  )
}

export default App
