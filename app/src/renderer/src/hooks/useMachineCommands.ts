import { useCallback } from 'react'

export const useMachineCommands = (sendCommand: (cmd: string) => Promise<void>) => {
  const start = useCallback(() => sendCommand('START'), [sendCommand])
  const pause = useCallback(() => sendCommand('PAUSE'), [sendCommand])
  const stop = useCallback(() => sendCommand('STOP'), [sendCommand])
  const reset = useCallback(() => sendCommand('RESET'), [sendCommand])
  const tare = useCallback(() => sendCommand('TARE'), [sendCommand])
  const elevatorUp = useCallback(() => sendCommand('ELEV:UP'), [sendCommand])
  const elevatorDown = useCallback(() => sendCommand('ELEV:DOWN'), [sendCommand])
  const setSimulationMode = useCallback(
    (enabled: boolean) => sendCommand(enabled ? 'MODE:SIM' : 'MODE:REAL'),
    [sendCommand]
  )

  return {
    start,
    pause,
    stop,
    reset,
    tare,
    elevatorUp,
    elevatorDown,
    setSimulationMode,
  }
}