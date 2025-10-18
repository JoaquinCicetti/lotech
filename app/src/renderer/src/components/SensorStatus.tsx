import { useAppStore } from '@renderer/store/appStore'
import { Activity, CheckCircle, Circle, Save, Settings, X } from 'lucide-react'

import { useState } from 'react'

interface SensorStatusProps {
  onSendCommand?: (command: string) => void
}

export function SensorStatus({ onSendCommand }: SensorStatusProps) {
  const { systemStatus, isConnected } = useAppStore()
  const { sensors, proximityDistance } = systemStatus
  const [editingThresholds, setEditingThresholds] = useState(false)

  // Use fixed thresholds for now - these could be stored in the app store later
  const upThreshold = 100
  const downThreshold = 20
  const [tempUpThreshold, setTempUpThreshold] = useState(upThreshold)
  const [tempDownThreshold, setTempDownThreshold] = useState(downThreshold)

  const handleSaveThresholds = () => {
    if (!onSendCommand) return
    onSendCommand(`SET:PROX:UP:${tempUpThreshold}`)
    onSendCommand(`SET:PROX:DOWN:${tempDownThreshold}`)
    setEditingThresholds(false)
  }

  const handleCancelEdit = () => {
    setTempUpThreshold(upThreshold)
    setTempDownThreshold(downThreshold)
    setEditingThresholds(false)
  }

  const SensorIndicator = ({
    label,
    active,
    activeText = 'ON',
    inactiveText = 'OFF',
    activeColor = 'text-green-500',
    inactiveColor = 'text-gray-400',
  }: {
    label: string
    active: boolean
    activeText?: string
    inactiveText?: string
    activeColor?: string
    inactiveColor?: string
  }) => (
    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        {active ? (
          <>
            <CheckCircle className={`h-4 w-4 ${activeColor}`} />
            <span className={`text-sm font-semibold ${activeColor}`}>{activeText}</span>
          </>
        ) : (
          <>
            <Circle className={`h-4 w-4 ${inactiveColor}`} />
            <span className={`text-sm ${inactiveColor}`}>{inactiveText}</span>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        Sensor Status
      </h3>

      <div className="space-y-3">
        {/* Proximity Sensor Display */}
        {proximityDistance !== undefined && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-600">Proximity Sensor</h4>
              <button
                onClick={() => {
                  setEditingThresholds(!editingThresholds)
                  if (!editingThresholds) {
                    setTempUpThreshold(upThreshold)
                    setTempDownThreshold(downThreshold)
                  }
                }}
                className="rounded p-1 hover:bg-gray-200"
                title="Configure thresholds"
              >
                <Settings className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Distance</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600">{proximityDistance}</span>
                <span className="text-xs text-gray-500">
                  {proximityDistance > upThreshold
                    ? 'TOP'
                    : proximityDistance <= downThreshold
                      ? 'BOTTOM'
                      : 'MIDDLE'}
                </span>
              </div>
            </div>

            {/* Threshold Configuration Panel */}
            {editingThresholds && (
              <div className="mt-2 rounded-lg bg-yellow-50 p-3">
                <div className="mb-2 text-sm font-medium text-gray-700">Configure Thresholds</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Top Position (&gt;)</label>
                    <input
                      type="number"
                      min="0"
                      max="1024"
                      value={tempUpThreshold}
                      onChange={(e) => setTempUpThreshold(Number(e.target.value))}
                      className="w-24 rounded border px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-600">Bottom Position (≤)</label>
                    <input
                      type="number"
                      min="0"
                      max="1024"
                      value={tempDownThreshold}
                      onChange={(e) => setTempDownThreshold(Number(e.target.value))}
                      className="w-24 rounded border px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveThresholds}
                      className="flex items-center gap-1 rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                    >
                      <Save className="h-3 w-3" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Visual proximity bar */}
            <div className="mt-2 rounded bg-gray-100 p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-gray-600">{`Bottom (≤${downThreshold})`}</span>
                <span className="text-xs text-gray-600">{`Top (>${upThreshold})`}</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-gray-300">
                {/* Simplified bar without incorrect calculations */}
                <div
                  className="absolute h-full bg-gradient-to-r from-orange-400 to-green-500 transition-all duration-300"
                  style={{
                    width: '50%', // Just show a static bar for now
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">Position Sensors</h4>
          <div className="space-y-2">
            <SensorIndicator
              label="Position: Top"
              active={sensors.posAlta}
              activeText={proximityDistance !== undefined ? `YES (${proximityDistance})` : 'YES'}
            />
            <SensorIndicator
              label="Position: Bottom"
              active={sensors.posBaja}
              activeText={proximityDistance !== undefined ? `YES (${proximityDistance})` : 'YES'}
            />
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">Container Sensors</h4>
          <div className="space-y-2">
            <SensorIndicator
              label="Container Present"
              active={!sensors.frascoVacio}
              activeText="PRESENT"
              inactiveText="EMPTY"
              activeColor="text-green-500"
              inactiveColor="text-orange-500"
            />
            <SensorIndicator
              label="Pills Loaded"
              active={sensors.pastillasCargadas}
              activeText="LOADED"
              inactiveText="NOT LOADED"
              activeColor="text-green-500"
              inactiveColor="text-orange-500"
            />
          </div>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-gray-600">Weight Sensor</h4>
          <div className="space-y-2">
            <SensorIndicator
              label="Weight Stable"
              active={sensors.weightStable}
              activeText="STABLE"
              inactiveText="UNSTABLE"
            />
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">Current Weight</span>
              <span className="text-sm font-semibold text-gray-900">
                {systemStatus.weight?.toFixed(2) || '0.00'} g
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
