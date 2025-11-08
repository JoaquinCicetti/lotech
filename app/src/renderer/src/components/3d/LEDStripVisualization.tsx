import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useMemo } from 'react'
import * as THREE from 'three'

interface LEDStripVisualizationProps {
  /** Position offset to match the machine model */
  modelPosition: [number, number, number]
  /** Scale to match the machine model */
  modelScale: number
}

export const LEDStripVisualization: React.FC<LEDStripVisualizationProps> = (props) => {
  const { modelPosition, modelScale } = props
  const { led } = useSettingsStore()

  // Create a path around the machine perimeter (rectangular loop)
  const stripPath = useMemo(() => {
    const baseX = modelPosition[0] + 0.26 * modelScale // Slightly above ground
    const baseY = modelPosition[1] + 0.02 * modelScale // Slightly above ground
    const baseZ = modelPosition[2] + 0.16 * modelScale // Slightly above ground

    // Machine dimensions (approximate)
    const width = 0.22 * modelScale
    const depth = 0.34 * modelScale

    // Create points for a rectangular path around the machine
    const points: THREE.Vector3[] = []
    const segmentsPerSide = 7 // 7 LEDs per side * 4 sides = 28, plus 2 for corners = 30

    // Front side (left to right)
    for (let i = 0; i <= segmentsPerSide; i++) {
      const t = i / segmentsPerSide
      points.push(new THREE.Vector3(baseX - width / 2 + t * width, baseY, baseZ + depth / 2))
    }

    // Right side (front to back)
    for (let i = 1; i <= segmentsPerSide; i++) {
      const t = i / segmentsPerSide
      points.push(new THREE.Vector3(baseX + width / 2, baseY, baseZ + depth / 2 - t * depth))
    }

    // Back side (right to left)
    for (let i = 1; i <= segmentsPerSide; i++) {
      const t = i / segmentsPerSide
      points.push(new THREE.Vector3(baseX + width / 2 - t * width, baseY, baseZ - depth / 2))
    }

    // Left side (back to front)
    for (let i = 1; i < segmentsPerSide; i++) {
      const t = i / segmentsPerSide
      points.push(new THREE.Vector3(baseX - width / 2, baseY, baseZ - depth / 2 + t * depth))
    }

    return points
  }, [modelPosition, modelScale])

  // Take first 30 points for the 30 LEDs
  const ledPositions = stripPath.slice(0, 30)

  // Create the wire path geometry
  const wireGeometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(stripPath, true)
    return new THREE.TubeGeometry(curve, 128, 0.01, 8, true)
  }, [stripPath])

  // Calculate brightness multiplier (0-1 range from 0-255)
  const brightnessFactor = led.brightness / 255

  return (
    <group>
      {/* Wire/tube representing the LED strip */}
      <mesh>
        <primitive object={wireGeometry} attach="geometry" />
        <meshStandardMaterial color="#333333" emissive="#111111" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Individual LED lights */}
      {ledPositions.map((pos, index) => {
        const color = led.colors[index]
        if (!color) return null

        const ledColor = new THREE.Color(color.r / 255, color.g / 255, color.b / 255)

        // Only show light if LED has color and brightness > 0
        const isOn = brightnessFactor > 0 && (color.r > 0 || color.g > 0 || color.b > 0)

        return (
          <group key={index} position={pos}>
            {/* LED bulb (small sphere) */}
            <mesh>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshStandardMaterial
                color={ledColor}
                emissive={ledColor}
                emissiveIntensity={isOn ? brightnessFactor * 2 : 0}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>

            {/* Point light emanating from LED */}
            {isOn && <pointLight args={[ledColor, brightnessFactor, 0.3, 1]} castShadow={false} />}
          </group>
        )
      })}
    </group>
  )
}
