import { useConnectionStore } from '@renderer/store/connectionStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useCallback, useEffect, useRef } from 'react'
import { StatusCommand } from './commands'
import { SerialMessageParser } from './parser'

interface UseSerialConnectionReturn {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendCommand: (cmd: string) => Promise<void>
  isConnected: boolean
  connectionError: string | null
}

export function useSerialConnection(): UseSerialConnectionReturn {
  const {
    selectedPort,
    isConnected,
    connectionError,
    setConnected,
    setConnectionError,
    setLastMessageTime,
    addSerialData,
    clearSerialData,
  } = useConnectionStore()

  const { updateFromSystemStatus, setError } = useControllerStateStore()
  const { setDelays, setDosing } = useSettingsStore()
  const hasReceivedFirstMessage = useRef(false)

  const sendCommand = useCallback(
    async (cmd: string): Promise<void> => {
      if (!selectedPort || !cmd) return
      try {
        await window.serial.write({ path: selectedPort, data: cmd + '\n' })
        addSerialData(`> ${cmd}`)
      } catch (error) {
        console.error('Error al enviar comando:', error)
      }
    },
    [selectedPort, addSerialData]
  )

  const connect = useCallback(async (): Promise<void> => {
    if (!selectedPort) return
    try {
      const success = await window.serial.open({ path: selectedPort, baudRate: 9600 })
      setConnected(success)
      setConnectionError(null)
      setLastMessageTime(Date.now())

      // Don't send any commands - wait for controller to initiate
      // Controller will send its initial state/status when ready
      hasReceivedFirstMessage.current = false
    } catch (error) {
      console.error('Error al conectar:', error)
      setConnectionError(error instanceof Error ? error.message : 'Error de conexión')
      setConnected(false)
    }
  }, [selectedPort, setConnected, setConnectionError, setLastMessageTime])

  const disconnect = useCallback(async (): Promise<void> => {
    if (!selectedPort) return
    try {
      await window.serial.close(selectedPort)
      setConnected(false)
      clearSerialData()
      setConnectionError(null)
    } catch (error) {
      console.error('Error al desconectar:', error)
    }
  }, [selectedPort, setConnected, clearSerialData, setConnectionError])

  // Handle serial data and errors
  useEffect(() => {
    const handleData = async ({ path, line }: { path: string; line: string }) => {
      console.log(`[${path}] ${line}`)

      // Update connection health
      setLastMessageTime(Date.now())
      setConnectionError(null)
      addSerialData(line)

      // On first message from controller, request settings
      if (!hasReceivedFirstMessage.current && line.trim().length > 0) {
        hasReceivedFirstMessage.current = true
        // Give controller a moment to stabilize
        setTimeout(async () => {
          const { selectedPort } = useConnectionStore.getState()
          if (selectedPort) {
            await window.serial.write({ path: selectedPort, data: StatusCommand.GET_DELAYS + '\n' })
            setTimeout(() => {
              window.serial.write({ path: selectedPort, data: StatusCommand.GET_DOSING + '\n' })
            }, 100)
          }
        }, 200)
      }

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
          setConnectionError('Sin datos recibidos por 5 segundos')
        }
      }
    }, 1000)

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

  return {
    connect,
    disconnect,
    sendCommand,
    isConnected,
    connectionError,
  }
}
