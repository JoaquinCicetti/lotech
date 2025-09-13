import { useAppStore } from '@renderer/store/appStore'
import { ToggleLeft, ToggleRight } from 'lucide-react'

export function SensorSimulation() {
  const { systemStatus, isConnected, simulationMode, queueCommand } = useAppStore()
  const { sensors } = systemStatus

  const handleSensorToggle = (sensor: string, currentState: boolean) => {
    const newState = currentState ? '0' : '1'
    queueCommand(`SIM:${sensor}:${newState}`)
  }

  const SensorToggle = ({
    label,
    sensor,
    active,
    description,
  }: {
    label: string
    sensor: string
    active: boolean
    description?: string
  }) => (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => handleSensorToggle(sensor, active)}
        disabled={!isConnected || !simulationMode}
        className={`flex items-center gap-2 rounded-md px-3 py-1.5 transition-all ${
          active
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
        } ${!isConnected || !simulationMode ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
      >
        {active ? (
          <>
            <ToggleRight className="h-4 w-4" />
            <span className="text-xs font-medium">ON</span>
          </>
        ) : (
          <>
            <ToggleLeft className="h-4 w-4" />
            <span className="text-xs font-medium">OFF</span>
          </>
        )}
      </button>
    </div>
  )

  if (!simulationMode) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-gray-800">Sensor Simulation</h3>
        <div className="py-4 text-center text-sm text-gray-500">
          Simulation mode is disabled. Enable simulation mode to control sensors manually.
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Sensor Simulation</h3>

      <div className="space-y-4">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-600">Position Sensors</h4>
          <div className="space-y-2">
            <SensorToggle
              label="Position Alta (Top)"
              sensor="POS_ALTA"
              active={sensors.posAlta}
              description="Simulate elevator at top position"
            />
            <SensorToggle
              label="Position Baja (Bottom)"
              sensor="POS_BAJA"
              active={sensors.posBaja}
              description="Simulate elevator at bottom position"
            />
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-600">Container Sensors</h4>
          <div className="space-y-2">
            <SensorToggle
              label="Frasco Vacío (Empty Container)"
              sensor="FRASCO_VACIO"
              active={sensors.frascoVacio}
              description="Simulate empty container position"
            />
            <SensorToggle
              label="Pastillas Cargadas (Pills Loaded)"
              sensor="PASTILLAS_CARGADAS"
              active={sensors.pastillasCargadas}
              description="Simulate pills loaded in dosing wheel"
            />
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-600">Weight Sensor</h4>
          <div className="space-y-2">
            <SensorToggle
              label="Weight Stable"
              sensor="WEIGHT_STABLE"
              active={sensors.weightStable}
              description="Simulate stable weight reading"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
        <p className="text-xs text-yellow-800">
          <strong>Note:</strong> These controls only work in simulation mode. Position sensors
          cannot both be ON simultaneously.
        </p>
      </div>
    </div>
  )
}
