import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { THREE_COLORS } from '@renderer/constants/theme'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { calculateElevatorPosition, smoothLerp } from './animation/animationUtils'
import { ELEVATOR_MAX_HEIGHT } from './animation/constants'

interface ElevatorIndicatorsProps {
  /** Position offset to match the machine model */
  modelPosition: [number, number, number]
  /** Scale to match the machine model */
  modelScale: number
}

export const ElevatorIndicators: React.FC<ElevatorIndicatorsProps> = (props) => {
  const { modelPosition, modelScale } = props

  // Get sensor data
  const { sensorReadings } = useControllerStateStore()
  const proximityDistance = sensorReadings.proximityDistance
  const proximity = useSettingsStore((state) => state.proximity)

  // Refs for the indicator objects
  const sphereRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  // Track current sphere position for smooth animation
  const spherePositionRef = useRef(0)

  // Calculate elevator position in 3D space
  const elevatorY = useMemo(() => {
    if (proximityDistance > 0) {
      return calculateElevatorPosition({
        proximityDistance,
        minProximity: proximity.minProximity,
        maxProximity: proximity.maxProximity,
        maxHeight: ELEVATOR_MAX_HEIGHT,
      })
    }
    return 0
  }, [proximityDistance, proximity.minProximity, proximity.maxProximity])

  // Colors for active/inactive states - using theme colors
  const activeColor = new THREE.Color(THREE_COLORS.indicators.active)
  const dimColor = new THREE.Color(THREE_COLORS.indicators.inactive)

  // Animate indicator sphere with smooth lerp
  useFrame((_, delta) => {
    // Use actual hardware sensor readings
    const isAtBottom = sensorReadings.posBaja
    const isAtTop = sensorReadings.posAlta
    const atLimit = isAtTop || isAtBottom

    // Update sphere position with smooth lerp
    if (sphereRef.current) {
      const targetY = baseY + elevatorY / 65

      spherePositionRef.current = smoothLerp({
        current: spherePositionRef.current,
        target: targetY,
        delta,
        speed: 6, // Match elevator speed
      })

      sphereRef.current.position.y = spherePositionRef.current

      // Update sphere color and glow based on position
      const material = sphereRef.current.material as THREE.MeshStandardMaterial
      material.color.copy(atLimit ? activeColor : dimColor)
      material.emissive.copy(atLimit ? activeColor : dimColor)
      material.emissiveIntensity = atLimit ? 0.8 : 0.2
    }

    // Update light - only shine when at limit
    if (lightRef.current) {
      lightRef.current.intensity = atLimit ? 2.0 : 0
      lightRef.current.color.copy(activeColor)
    }
  })

  // Calculate positions relative to the machine model
  // Offset to the side of the elevator so indicators are visible
  const indicatorX = modelPosition[0] + 0.3 * modelScale
  const indicatorZ = modelPosition[2]

  // Top and bottom positions match the actual elevator range
  const baseY = modelPosition[1]
  // Divide by 30 to match actual elevator travel (empirically determined)
  const elevatorRange = ELEVATOR_MAX_HEIGHT / 65
  const bottomY = baseY
  const topY = baseY + elevatorRange

  // Card position - offset to the right like a popover
  const popoverOffsetX = 0.25
  const cardPosition: [number, number, number] = [
    indicatorX + popoverOffsetX,
    spherePositionRef.current,
    indicatorZ,
  ]

  return (
    <group>
      {/* Moving sphere indicator - small sphere that follows elevator and glows at limits */}
      <group position={[indicatorX, 0, indicatorZ]}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={dimColor} emissive={dimColor} emissiveIntensity={0.2} />
        </mesh>
        <pointLight ref={lightRef} color={activeColor} intensity={0} />
      </group>

      {/* Connecting line from sphere to popover */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                indicatorX + 0.06,
                spherePositionRef.current,
                indicatorZ,
                indicatorX + popoverOffsetX - 0.08,
                spherePositionRef.current,
                indicatorZ,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={THREE_COLORS.indicators.path} opacity={0.5} transparent />
      </line>

      {/* Popover card - compact display next to sphere */}
      <Html position={cardPosition} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="bg-background/90 border-border flex items-center gap-1.5 rounded-md border px-2 py-1 shadow-md backdrop-blur-sm">
          <span className="font-mono text-sm font-semibold">{proximityDistance}</span>
          <span className="text-muted-foreground text-xs">mm</span>
        </div>
      </Html>

      {/* Vertical line showing elevator travel path */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([indicatorX, bottomY, indicatorZ, indicatorX, topY, indicatorZ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={THREE_COLORS.indicators.path} opacity={0.3} transparent />
      </line>

      {/* Top marker */}
      <mesh position={[indicatorX, topY, indicatorZ]}>
        <boxGeometry args={[0.05, 0.02, 0.05]} />
        <meshStandardMaterial color={THREE_COLORS.indicators.path} />
      </mesh>

      {/* Bottom marker */}
      <mesh position={[indicatorX, bottomY, indicatorZ]}>
        <boxGeometry args={[0.05, 0.02, 0.05]} />
        <meshStandardMaterial color={THREE_COLORS.indicators.path} />
      </mesh>
    </group>
  )
}
