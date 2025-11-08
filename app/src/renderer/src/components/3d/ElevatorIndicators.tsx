import { useFrame } from '@react-three/fiber'
import { THREE_COLORS } from '@renderer/constants/theme'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { calculateElevatorPosition } from './animation/animationUtils'
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
  const positionIndicatorRef = useRef<THREE.Mesh>(null)
  const topSensorRef = useRef<THREE.Mesh>(null)
  const bottomSensorRef = useRef<THREE.Mesh>(null)
  const topLightRef = useRef<THREE.PointLight>(null)
  const bottomLightRef = useRef<THREE.PointLight>(null)

  // Calculate elevator position in 3D space
  const elevatorY = useMemo(() => {
    if (proximityDistance > 0 && proximity.minProximity > 0 && proximity.maxProximity > 0) {
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
  const blackColor = new THREE.Color(0x000000) // no glow when off

  // Animate indicator
  useFrame(() => {
    // Update position indicator to follow elevator
    // Scale to match the indicator line range and add base offset
    if (positionIndicatorRef.current) {
      positionIndicatorRef.current.position.y = baseY + elevatorY / 34
    }

    // Use actual hardware sensor readings (same as 2D elevator card)
    const isAtBottom = sensorReadings.posBaja
    const isAtTop = sensorReadings.posAlta

    // Debug logging (every 2 seconds)
    if (positionIndicatorRef.current) {
      const now = Date.now()
      if (
        !positionIndicatorRef.current.userData.lastLog ||
        now - positionIndicatorRef.current.userData.lastLog > 2000
      ) {
        console.log(
          '[INDICATORS] elevatorY:',
          elevatorY.toFixed(2),
          'posAlta:',
          isAtTop,
          'posBaja:',
          isAtBottom,
          'prox:',
          proximityDistance
        )
        positionIndicatorRef.current.userData.lastLog = now
      }
    }

    // Update top sensor color
    if (topSensorRef.current) {
      const material = topSensorRef.current.material as THREE.MeshStandardMaterial
      material.color.lerp(isAtTop ? activeColor : dimColor, 0.1)
      material.emissive.lerp(isAtTop ? activeColor : blackColor, 0.1)
      material.emissiveIntensity = isAtTop ? 0.5 : 0
    }

    // Update top light - only shine when active
    if (topLightRef.current) {
      topLightRef.current.intensity = isAtTop ? 1.0 : 0
      topLightRef.current.color.lerp(activeColor, 0.1)
    }

    // Update bottom sensor color - instant, no lerp to avoid blinking
    if (bottomSensorRef.current) {
      const material = bottomSensorRef.current.material as THREE.MeshStandardMaterial
      material.color.copy(isAtBottom ? activeColor : dimColor)
      material.emissive.copy(isAtBottom ? activeColor : blackColor)
      material.emissiveIntensity = isAtBottom ? 0.5 : 0
    }

    // Update bottom light - only shine when active, instant
    if (bottomLightRef.current) {
      bottomLightRef.current.intensity = isAtBottom ? 1.0 : 0
      bottomLightRef.current.color.copy(activeColor)
    }
  })

  // Calculate positions relative to the machine model
  // Offset to the side of the elevator so indicators are visible
  const indicatorX = modelPosition[0] + 0.3 * modelScale
  const indicatorZ = modelPosition[2]

  // Top and bottom positions match the actual elevator range
  const baseY = modelPosition[1]
  // Divide by 30 to match actual elevator travel (empirically determined)
  const elevatorRange = ELEVATOR_MAX_HEIGHT / 34
  const bottomY = baseY
  const topY = baseY + elevatorRange

  return (
    <group>
      {/* Position Indicator - follows elevator */}
      <mesh
        ref={positionIndicatorRef}
        position={[indicatorX, 0, indicatorZ]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[0.08, 0.15, 4]} />
        <meshStandardMaterial
          color={THREE_COLORS.indicators.position}
          emissive={THREE_COLORS.indicators.position}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* Top Sensor Indicator */}
      <group position={[indicatorX, topY, indicatorZ]}>
        <mesh ref={topSensorRef}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={dimColor} emissive={blackColor} emissiveIntensity={0} />
        </mesh>
        <pointLight ref={topLightRef} color={activeColor} intensity={0} />
      </group>

      {/* Bottom Sensor Indicator */}
      <group position={[indicatorX, bottomY, indicatorZ]}>
        <mesh ref={bottomSensorRef}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={dimColor} emissive={blackColor} emissiveIntensity={0} />
        </mesh>
        <pointLight ref={bottomLightRef} color={activeColor} intensity={0} />
      </group>

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
    </group>
  )
}
