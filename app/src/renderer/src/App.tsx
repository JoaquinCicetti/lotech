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
    commandQueue,
    isProcessingCommand,
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
    dequeueCommand,
    setProcessingCommand,
    addPendingConfirmation,
    removePendingConfirmation,
    getPendingConfirmation,
  } = useAppStore()

  const [showSettings, setShowSettings] = useState<boolean>(false)

  // Command queue processor
  useEffect(() => {
    if (!isConnected || isProcessingCommand || commandQueue.length === 0) return
    
    const processNextCommand = async () => {
      const cmd = dequeueCommand()
      if (!cmd) return
      
      setProcessingCommand(true)
      
      // Track pending confirmations for settings commands
      if (cmd.startsWith('SET:')) {
        const key = cmd.split(':').slice(0, 2).join(':')
        addPendingConfirmation(key, {
          command: cmd,
          timestamp: Date.now(),
          timeoutMs: 3000,
          onTimeout: () => {
            console.warn(`Command timeout: ${cmd}`)
            // Could revert optimistic update here if needed
          }
        })
      }
      
      await sendCommandDirect(cmd)
      
      // Wait a bit before processing next command to avoid buffer overflow
      await new Promise(resolve => setTimeout(resolve, 100))
      setProcessingCommand(false)
    }
    
    processNextCommand()
  }, [isConnected, isProcessingCommand, commandQueue, selectedPort, dequeueCommand, setProcessingCommand, addPendingConfirmation])
  
  // Check for confirmation timeouts
  useEffect(() => {
    const interval = setInterval(() => {
      const store = useAppStore.getState()
      const now = Date.now()
      
      store.pendingConfirmations.forEach((pending, key) => {
        const elapsed = now - pending.timestamp
        if (pending.timeoutMs && elapsed > pending.timeoutMs) {
          console.warn(`Confirmation timeout for ${key}`)
          if (pending.onTimeout) pending.onTimeout()
          removePendingConfirmation(key)
        }
      })
    }, 500)
    
    return () => clearInterval(interval)
  }, [removePendingConfirmation])

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
        const store = useAppStore.getState()
        const currentDelays = store.currentDelays

        // Check if this is a confirmation for a pending command
        if (line.startsWith('SET:DELAY:')) {
          const key = line.split(':').slice(0, 2).join(':')
          removePendingConfirmation(key)
        }

        // Merge with current delays (for individual updates)
        const newDelays = {
          settle: delays.settle ?? currentDelays.settle,
          weight: delays.weight ?? currentDelays.weight,
          transfer: delays.transfer ?? currentDelays.transfer,
          grind: delays.grind ?? currentDelays.grind,
          cap: delays.cap ?? currentDelays.cap,
          elevUp: delays.elevup ?? delays.up ?? currentDelays.elevUp,
          elevDown: delays.elevdown ?? delays.down ?? currentDelays.elevDown,
        }

        // Update store with confirmed values from device
        setCurrentDelays(newDelays)

        // Save to localStorage
        localStorage.setItem('delaySettings', JSON.stringify(newDelays))
        return
      }

      // Check if it's a dosing response
      const dosing = SerialMessageParser.parseDosing(line)
      if (dosing) {
        const store = useAppStore.getState()
        const currentDosing = store.currentDosing
        
        // Check if this is a confirmation for a pending command
        if (line.startsWith('SET:DIVISIONS:') || line.startsWith('SET:LOT_SIZE:')) {
          const key = line.split(':').slice(0, 2).join(':')
          removePendingConfirmation(key)
        }

        // Merge with current dosing (for individual updates)
        const newDosing = {
          wheelDivisions: dosing.divisions ?? currentDosing.wheelDivisions,
          lotSize: dosing.lot_size ?? currentDosing.lotSize,
        }

        // Update store with confirmed values from device
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
        // Wait a bit for the controller to be ready
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Send initial commands directly (not queued) to get current state
        await sendCommandDirect('STATUS')
        await new Promise(resolve => setTimeout(resolve, 100))
        await sendCommandDirect('GET:DELAYS')
        await new Promise(resolve => setTimeout(resolve, 100))
        await sendCommandDirect('GET:DOSING')
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

  const sendCommandDirect = async (cmd: string): Promise<void> => {
    if (!selectedPort || !cmd) return
    try {
      await window.serial.write({ path: selectedPort, data: `${cmd}\r\n` })
    } catch (error) {
      console.error('Failed to send command:', error)
    }
  }
  
  // Queue command for sequential processing
  const sendCommand = (cmd: string): void => {
    if (!cmd) return
    const store = useAppStore.getState()
    store.queueCommand(cmd)
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
            <Console serialData={serialData} onSendCommand={sendCommand} />
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
            />
            <CommandPanel onSendCommand={sendCommand} />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default App
