import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { THREE_COLORS } from '@renderer/constants/theme'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import React, { useRef, useState } from 'react'
import * as THREE from 'three'
import { smoothLerp } from './animation/animationUtils'
import { ELEVATOR_MAX_HEIGHT } from './animation/constants'

interface ElevatorIndicatorsProps {
  /** Position offset to match the machine model */
  modelPosition: [number, number, number]
  /** Scale to match the machine model */
  modelScale: number
  /** Refs for AnimationController to animate */
  sphereRef: React.RefObject<THREE.Mesh | null>
  lightRef: React.RefObject<THREE.PointLight | null>
}

export const ElevatorIndicators: React.FC<ElevatorIndicatorsProps> = (props) => {
  const { modelPosition, modelScale, sphereRef, lightRef } = props

  // Get sensor data
  const { sensorReadings } = useControllerStateStore()
  const proximityDistance = sensorReadings.proximityDistance

  // Track smoothed proximity distance for display only
  const smoothedProximityRef = useRef(0)
  const [cardY, setCardY] = useState(modelPosition[1])

  // Smooth the proximity distance number for display and update card position
  useFrame((_, delta) => {
    // Clamp delta to prevent huge jumps when app regains focus
    const clampedDelta = Math.min(delta, 0.1) // Max 100ms

    // Smooth the proximity distance number for display
    smoothedProximityRef.current = smoothLerp({
      current: smoothedProximityRef.current,
      target: proximityDistance,
      delta: clampedDelta,
      speed: 1, // Match AnimationController elevator speed
    })

    // Update card Y position to match sphere (update state for Html to re-render)
    if (sphereRef.current) {
      const newCardY = baseY + sphereRef.current.position.y
      setCardY(newCardY)
    }
  })

  // Calculate positions relative to the machine model
  // Offset to the side of the elevator so indicators are visible
  const indicatorX = modelPosition[0] + 0.2 * modelScale
  const indicatorZ = modelPosition[2]

  // Top and bottom positions match the actual elevator range
  const baseY = modelPosition[1]
  // Divide by 65 to match actual elevator travel (empirically determined)
  const elevatorRange = ELEVATOR_MAX_HEIGHT / 65
  const bottomY = baseY
  const topY = baseY + elevatorRange

  // Popover offset
  const popoverOffset = 0.5
  const cardPosition: [number, number, number] = [indicatorX, cardY + popoverOffset, indicatorZ]

  return (
    <group>
      {/* Moving sphere indicator - AnimationController animates sphereRef.position.y */}
      <group position={[indicatorX, baseY, indicatorZ]}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial
            color={THREE_COLORS.indicators.inactive}
            emissive={THREE_COLORS.indicators.inactive}
            emissiveIntensity={0.01}
          />
        </mesh>
        <pointLight ref={lightRef} color={THREE_COLORS.indicators.active} intensity={0} />
      </group>

      {/* Popover card - positioned absolutely, updated every frame via state */}
      <Html position={cardPosition} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div className="bg-background/80 border-border flex items-center gap-1.5 rounded-md border px-2 py-1 shadow-md backdrop-blur-sm">
          <span className="font-mono text-2xl font-semibold">
            {Math.round(smoothedProximityRef.current)}
          </span>
          <span className="text-muted-foreground text-xl">mm</span>
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
