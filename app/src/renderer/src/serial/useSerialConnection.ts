import { useConnectionStore } from '@renderer/store/connectionStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
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
  const { setDelays, setDosing, setElevator, setTimeouts } = useSettingsStore()
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
      const success = await window.serial.open({ path: selectedPort, baudRate: 115200 })
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

      // Show toasts for errors, warnings, and blocked messages
      if (line.includes('ERROR:')) {
        // Clean up the error message, removing encoding issues
        const errorMessage = line
          .replace('ERROR:', '')
          .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
          .trim()

        // Only show toast if we have a meaningful message
        if (errorMessage && errorMessage.length > 0) {
          toast.error(errorMessage, {
            duration: 5000,
            description: 'Error del controlador',
          })
        }
      } else if (line.includes('BLOCKED:')) {
        const blockedMessage = line
          .replace('BLOCKED:', '')
          .replace(/[^\x20-\x7E]/g, '')
          .trim()

        if (blockedMessage && blockedMessage.length > 0) {
          toast.warning(blockedMessage, {
            duration: 4000,
            description: 'Acción bloqueada',
          })
        }
      } else if (line.includes('WARNING:')) {
        const warningMessage = line
          .replace('WARNING:', '')
          .replace(/[^\x20-\x7E]/g, '')
          .trim()

        if (warningMessage && warningMessage.length > 0) {
          toast.warning(warningMessage, {
            duration: 4000,
            description: 'Advertencia',
          })
        }
      } else if (line.includes('ALERT:')) {
        const alertMessage = line
          .replace('ALERT:', '')
          .replace(/[^\x20-\x7E]/g, '')
          .trim()

        if (alertMessage && alertMessage.length > 0) {
          toast.warning(alertMessage, {
            duration: 4000,
          })
        }
      }

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
              setTimeout(() => {
                window.serial.write({ path: selectedPort, data: StatusCommand.GET_ELEVATOR + '\n' })
                setTimeout(() => {
                  window.serial.write({ path: selectedPort, data: StatusCommand.GET_TIMEOUTS + '\n' })
                }, 300)
              }, 200)
            }, 100)
          }
        }, 200)
      }

      // Parse delays
      const delays = SerialMessageParser.parseDelays(line)
      if (delays) {
        // Only update values that were actually received
        const currentDelays = useSettingsStore.getState().delays
        const newDelays = {
          settle: delays.settle ?? currentDelays.settle,
          weight: delays.weight ?? currentDelays.weight,
          transfer: delays.transfer ?? currentDelays.transfer,
          grind: delays.grind ?? currentDelays.grind,
          cap: delays.cap ?? currentDelays.cap,
          elevUp: delays.elevUp ?? currentDelays.elevUp,  // Now properly mapped to camelCase
          elevDown: delays.elevDown ?? currentDelays.elevDown,  // Now properly mapped to camelCase
        }
        setDelays(newDelays)
        return
      }

      // Parse dosing
      const dosing = SerialMessageParser.parseDosing(line)
      if (dosing) {
        // Only update if we got valid values, don't overwrite with 0
        const currentDosing = useSettingsStore.getState().dosing
        const newDosing = {
          wheelDivisions: dosing.divisions ?? currentDosing.wheelDivisions,
          lotSize: dosing.lot_size ?? currentDosing.lotSize,
          motorSpeed: dosing.motor_speed ? dosing.motor_speed / 400 : currentDosing.motorSpeed,  // Convert steps/sec to rad/sec (approx)
        }
        setDosing(newDosing)
        return
      }

      // Parse elevator settings
      const elevator = SerialMessageParser.parseElevator(line)
      if (elevator) {
        // Only update if we got valid values
        const currentElevator = useSettingsStore.getState().elevator
        const newElevator = {
          speed: elevator.speed ?? currentElevator.speed,
          minSpeed: elevator.min_speed ?? currentElevator.minSpeed,
          maxSpeed: elevator.max_speed ?? currentElevator.maxSpeed,
        }
        setElevator(newElevator)
        return
      }

      // Parse timeout settings
      const timeouts = SerialMessageParser.parseTimeouts(line)
      if (timeouts) {
        // Only update if we got valid values
        const currentTimeouts = useSettingsStore.getState().timeouts
        const newTimeouts = {
          transferMax: timeouts.transfer_max ?? currentTimeouts.transferMax,
          capMax: timeouts.cap_max ?? currentTimeouts.capMax,
          grinderMax: timeouts.grinder_max ?? currentTimeouts.grinderMax,
        }
        setTimeouts(newTimeouts)
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
      toast.error(error, {
        duration: 5000,
        description: 'Error de comunicación serial',
      })
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
    setElevator,
    setTimeouts,
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
