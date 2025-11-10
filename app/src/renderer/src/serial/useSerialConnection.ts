import { useConnectionStore } from '@renderer/store/connectionStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { usePillTrackingStore } from '@renderer/store/pillTrackingStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import { MachineState } from '@renderer/types'
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

// Helper function to filter weight readings with compression
function filterWeight(
  rawWeight: number,
  filterSettings: {
    targetWeight: number
    tolerance: number
    zeroThreshold: number
    compressionFactor: number
  }
): number {
  const { targetWeight, tolerance, zeroThreshold, compressionFactor } = filterSettings

  // If close to zero, return exactly zero
  if (Math.abs(rawWeight) < zeroThreshold) {
    return 0
  }

  // If close to target weight (within tolerance), apply compression towards target
  if (Math.abs(rawWeight - targetWeight) <= tolerance) {
    // Compress the difference towards target
    // Formula: compressed = target - (target - rawWeight) / compressionFactor
    // Example: target=1.0, raw=0.8, factor=5 → 1.0 - (1.0-0.8)/5 = 1.0 - 0.04 = 0.96
    const difference = targetWeight - rawWeight
    const compressedDifference = difference / compressionFactor
    const compressedValue = targetWeight - compressedDifference

    return Math.round(compressedValue * 1000) / 1000
  }

  // Outside target range - clamp to nearest (0 or target)
  const distanceToZero = Math.abs(rawWeight)
  const distanceToTarget = Math.abs(rawWeight - targetWeight)
  return distanceToZero < distanceToTarget ? 0 : targetWeight
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

  // Weight collection buffer for filtering/averaging during weighing
  const weightBuffer = useRef(new Map<number, number[]>())

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

      // Clear autoconnect settings when manually disconnecting
      localStorage.removeItem('lotech_autoconnect_port')
      localStorage.removeItem('lotech_autoconnect_enabled')
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
                  window.serial.write({
                    path: selectedPort,
                    data: StatusCommand.GET_TIMEOUTS + '\n',
                  })
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
          elevUp: delays.elevUp ?? currentDelays.elevUp, // Now properly mapped to camelCase
          elevDown: delays.elevDown ?? currentDelays.elevDown, // Now properly mapped to camelCase
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
          // Divide wheelDivisions by 2 when receiving from device (device stores 2x the UI value)
          wheelDivisions: dosing.divisions ? dosing.divisions / 2 : currentDosing.wheelDivisions,
          lotSize: dosing.lot_size ?? currentDosing.lotSize,
          motorSpeed: dosing.motor_speed ? dosing.motor_speed / 400 : currentDosing.motorSpeed, // Convert steps/sec to rad/sec (approx)
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

      // Handle CYCLE:COMPLETE message
      if (line.includes('CYCLE:COMPLETE')) {
        const trackingStore = usePillTrackingStore.getState()
        if (trackingStore.isTracking && trackingStore.currentCycle) {
          // End the cycle
          const completedCycle = trackingStore.endCycle()

          if (completedCycle) {
            // Automatically show save dialog
            const csvContent = trackingStore.exportCycleData(completedCycle)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
            const filename = `lotech_${completedCycle.lotNumber}_${timestamp}.csv`

            setTimeout(async () => {
              try {
                const result = await window.file.saveDialog({
                  content: csvContent,
                  defaultFilename: filename,
                })

                if (result.success) {
                  toast.success(`Ciclo completado y guardado en ${result.path}`)
                  // // Reset system after successful save
                  // setTimeout(() => {
                  //   window.serial.write('RESET')
                  // }, 500)
                } else if (!result.canceled) {
                  toast.error('Error al guardar el archivo')
                }
              } catch (error) {
                console.error('Auto-save error:', error)
                toast.error('Error al guardar datos del ciclo')
              }
            }, 500)
          }
        }
        return
      }

      // Parse system status
      try {
        console.log('About to parse line:', line)
        const currentStatus = useControllerStateStore.getState()
        const calibrationFactor = useSettingsStore.getState().loadCell.calibrationFactor
        const weightFilterSettings = useSettingsStore.getState().weightFilter
        const statusUpdate = SerialMessageParser.parseMessage(
          line,
          {
            state: currentStatus.machineState,
            pillCount: currentStatus.pillCount,
            weight: currentStatus.currentWeight,
            sensors: currentStatus.sensorReadings,
            hardware: currentStatus.hardwareStatus,
          },
          calibrationFactor
        )

        if (statusUpdate) {
          // Apply weight filtering if weight is present
          if (statusUpdate.weight !== undefined) {
            statusUpdate.weight = filterWeight(statusUpdate.weight, weightFilterSettings)
          }
          // Collect weight readings during weighing state
          const isWeighing = currentStatus.machineState === MachineState.PESAJE
          if (isWeighing && statusUpdate.weight !== undefined && statusUpdate.weight > 0) {
            // Add to weight collection buffer
            if (!weightBuffer.current.has(currentStatus.pillCount)) {
              weightBuffer.current.set(currentStatus.pillCount, [])
            }
            weightBuffer.current.get(currentStatus.pillCount)!.push(statusUpdate.weight)
          }

          // Track pill when counter increments (after transfer completes)
          // IMPORTANT: Check BEFORE updating state!
          const trackingStore = usePillTrackingStore.getState()
          console.log('Tracking check:', {
            isTracking: trackingStore.isTracking,
            statusUpdatePillCount: statusUpdate.pillCount,
            currentCycle: trackingStore.currentCycle?.lotNumber,
          })

          if (trackingStore.isTracking && statusUpdate.pillCount !== undefined) {
            const currentPillCount = currentStatus.pillCount // Use OLD state before update
            console.log('Pill count comparison:', {
              new: statusUpdate.pillCount,
              current: currentPillCount,
            })

            // Pill counter increased - record the pill with filtered average
            if (statusUpdate.pillCount > currentPillCount) {
              let finalWeight = currentStatus.currentWeight || 0

              // Get collected weights for this pill
              const weights = weightBuffer.current.get(currentPillCount) || []

              if (weights.length > 0) {
                // Filter extremes and calculate average
                const sorted = [...weights].sort((a, b) => a - b)
                // Remove top and bottom 10% if we have enough samples
                const trimCount = weights.length > 10 ? Math.floor(weights.length * 0.1) : 0
                const trimmed = sorted.slice(trimCount, sorted.length - trimCount)

                // Calculate average
                finalWeight = trimmed.reduce((sum, w) => sum + w, 0) / trimmed.length

                console.log(
                  `Pill #${statusUpdate.pillCount} weight filtered: ${weights.length} samples -> ${trimmed.length} used -> avg: ${(finalWeight * 1000).toFixed(4)} mg`
                )
              }

              // Clear buffer for this pill
              weightBuffer.current.delete(currentPillCount)

              // Convert from grams to milligrams for recording
              trackingStore.recordPillWeight(finalWeight * 1000)

              console.log(
                `Pill #${statusUpdate.pillCount} recorded: ${(finalWeight * 1000).toFixed(4)} mg`
              )
            }
          }

          // NOW update the state after we've checked for pill increment
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
