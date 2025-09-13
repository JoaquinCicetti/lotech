import { useAppStore } from '@renderer/store/appStore'
import { CheckCircle, Circle, Activity } from 'lucide-react'

export function SensorStatus() {
  const { systemStatus, isConnected } = useAppStore()
  const { sensors, proximityDistance } = systemStatus

  const SensorIndicator = ({ 
    label, 
    active, 
    activeText = 'ON', 
    inactiveText = 'OFF',
    activeColor = 'text-green-500',
    inactiveColor = 'text-gray-400'
  }: {
    label: string
    active: boolean
    activeText?: string
    inactiveText?: string
    activeColor?: string
    inactiveColor?: string
  }) => (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        Sensor Status
      </h3>
      
      <div className="space-y-3">
        {/* Proximity Sensor Display */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Proximity Sensor</h4>
          <div className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Distance</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-blue-600">
                {proximityDistance !== undefined ? proximityDistance : '--'}
              </span>
              <span className="text-xs text-gray-500">
                (0-255)
              </span>
            </div>
          </div>
          
          {/* Visual proximity bar */}
          <div className="mt-2 p-2 bg-gray-100 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Near</span>
              <span className="text-xs text-gray-600">Far</span>
            </div>
            <div className="h-3 bg-gray-300 rounded-full relative overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
                style={{
                  width: proximityDistance !== undefined 
                    ? `${(proximityDistance / 255) * 100}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Position Sensors</h4>
          <div className="space-y-2">
            <SensorIndicator 
              label="Position: Top" 
              active={sensors.posAlta}
            />
            <SensorIndicator 
              label="Position: Bottom" 
              active={sensors.posBaja}
            />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-2">Container Sensors</h4>
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
          <h4 className="text-sm font-medium text-gray-600 mb-2">Weight Sensor</h4>
          <div className="space-y-2">
            <SensorIndicator 
              label="Weight Stable" 
              active={sensors.weightStable}
              activeText="STABLE"
              inactiveText="UNSTABLE"
            />
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
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