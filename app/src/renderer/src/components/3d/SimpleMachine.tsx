import React, { useRef } from 'react'
import { Box, Cylinder, Sphere } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SimpleMachineProps {
  systemStatus: {
    state: string
    sensors: {
      posAlta: boolean
      posBaja: boolean
    }
    pillCount: number
    targetPills: number
    weight?: number
    stateProgress?: number
  }
}

export const SimpleMachine: React.FC<SimpleMachineProps> = (props) => {
  const { systemStatus } = props
  
  const elevatorRef = useRef<THREE.Mesh>(null)
  const wheelRef = useRef<THREE.Mesh>(null)
  const grinderRef = useRef<THREE.Mesh>(null)
  
  useFrame((state, delta) => {
    // Animate elevator
    if (elevatorRef.current) {
      const targetY = systemStatus.sensors.posAlta ? 2 : systemStatus.sensors.posBaja ? -1 : 0.5
      elevatorRef.current.position.y = THREE.MathUtils.lerp(
        elevatorRef.current.position.y,
        targetY,
        delta * 2
      )
    }
    
    // Animate wheel during dosing
    if (wheelRef.current && systemStatus.state.includes('DOSIFICA')) {
      wheelRef.current.rotation.y += delta * 2
    }
    
    // Animate grinder during grinding
    if (grinderRef.current && systemStatus.state.includes('MOLIENDO')) {
      grinderRef.current.rotation.z += delta * 10
      // Vibration effect
      grinderRef.current.position.x = Math.sin(state.clock.elapsedTime * 50) * 0.01
    } else if (grinderRef.current) {
      grinderRef.current.position.x = 0
    }
  })
  
  return (
    <group>
      {/* Base Platform */}
      <Box args={[8, 0.5, 6]} position={[0, -2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#525252" metalness={0.4} roughness={0.5} />
      </Box>
      
      {/* Support Columns */}
      <Box args={[0.3, 4, 0.3]} position={[-3, 0, -2]} castShadow>
        <meshStandardMaterial color="#737373" metalness={0.5} roughness={0.3} />
      </Box>
      <Box args={[0.3, 4, 0.3]} position={[3, 0, -2]} castShadow>
        <meshStandardMaterial color="#737373" metalness={0.5} roughness={0.3} />
      </Box>
      <Box args={[0.3, 4, 0.3]} position={[-3, 0, 2]} castShadow>
        <meshStandardMaterial color="#737373" metalness={0.5} roughness={0.3} />
      </Box>
      <Box args={[0.3, 4, 0.3]} position={[3, 0, 2]} castShadow>
        <meshStandardMaterial color="#737373" metalness={0.5} roughness={0.3} />
      </Box>
      
      {/* Elevator */}
      <Box ref={elevatorRef} args={[2, 0.3, 2]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial 
          color={systemStatus.sensors.posAlta ? "#a3e635" : "#84cc16"} 
          metalness={0.3} 
          roughness={0.4}
          emissive={systemStatus.sensors.posAlta ? "#84cc16" : "#365314"}
          emissiveIntensity={0.2}
        />
      </Box>
      
      {/* Dosing Wheel */}
      <group position={[-2, 1, 0]}>
        <Cylinder ref={wheelRef} args={[0.8, 0.8, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <meshStandardMaterial 
            color={systemStatus.state.includes('DOSIFICA') ? "#fbbf24" : "#737373"}
            metalness={0.4} 
            roughness={0.3}
            emissive={systemStatus.state.includes('DOSIFICA') ? "#f59e0b" : "#404040"}
            emissiveIntensity={0.3}
          />
        </Cylinder>
        {/* Wheel divisions */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Box
            key={i}
            args={[0.05, 0.4, 0.7]}
            position={[
              Math.sin((i * Math.PI * 2) / 8) * 0.4,
              0,
              Math.cos((i * Math.PI * 2) / 8) * 0.4
            ]}
            rotation={[0, (i * Math.PI * 2) / 8, 0]}
          >
            <meshStandardMaterial color="#404040" />
          </Box>
        ))}
      </group>
      
      {/* Grinder */}
      <group position={[2, 1, 0]}>
        <Cylinder ref={grinderRef} args={[0.6, 0.4, 1]} castShadow>
          <meshStandardMaterial 
            color={systemStatus.state.includes('MOLIENDO') ? "#34d399" : "#737373"}
            metalness={0.3} 
            roughness={0.5}
            emissive={systemStatus.state.includes('MOLIENDO') ? "#10b981" : "#404040"}
            emissiveIntensity={0.3}
          />
        </Cylinder>
      </group>
      
      {/* Capper */}
      <group position={[0, 2.5, 0]}>
        <Cylinder args={[0.3, 0.3, 0.6]} castShadow>
          <meshStandardMaterial 
            color={systemStatus.state.includes('TAPANDO') ? "#fb923c" : "#737373"}
            metalness={0.4} 
            roughness={0.3}
            emissive={systemStatus.state.includes('TAPANDO') ? "#ea580c" : "#404040"}
            emissiveIntensity={0.3}
          />
        </Cylinder>
      </group>
      
      {/* Pills Container */}
      <Box args={[1.5, 2, 1.5]} position={[0, -0.5, -3]} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#a3a3a3" 
          metalness={0.2} 
          roughness={0.4}
          transparent
          opacity={0.8}
        />
      </Box>
      
      {/* Pills (visual representation) */}
      {Array.from({ length: Math.min(systemStatus.pillCount, 10) }).map((_, i) => (
        <Sphere
          key={i}
          args={[0.1]}
          position={[
            (Math.random() - 0.5) * 1.2,
            -0.5 + i * 0.15,
            -3 + (Math.random() - 0.5) * 1.2
          ]}
          castShadow
        >
          <meshStandardMaterial color="#fff" metalness={0.1} roughness={0.8} />
        </Sphere>
      ))}
    </group>
  )
}