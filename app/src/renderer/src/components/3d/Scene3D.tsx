import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { SCENE_COLORS } from '@renderer/constants/theme'
import React, { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { SystemStatus } from '../../types'
import { Background360 } from './Background360'
import { CameraController } from './CameraController'
import { ElevatorIndicators } from './ElevatorIndicators'
import { FloatingCards } from './FloatingCards'
import { GamingSetup } from './GamingSetup'
import { LEDStripVisualization } from './LEDStripVisualization'
import { Lighting } from './Lighting'
import { MachineModel } from './MachineModel'

interface Scene3DProps {
  systemStatus: SystemStatus
}

export const Scene3D: React.FC<Scene3DProps> = (props) => {
  const { systemStatus } = props

  // Refs for elevator indicator - shared between AnimationController and ElevatorIndicators
  const elevatorIndicatorRef = useRef<THREE.Mesh>(null)
  const elevatorLightRef = useRef<THREE.PointLight>(null)

  return (
    <div
      className="relative z-10 h-[100vh] w-full overflow-hidden rounded-lg"
      style={{
        background: SCENE_COLORS.background.gradient.from, // Simple fallback color
      }}
    >
      <Canvas
        camera={{ fov: 50, position: [8, 6, 8] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <CameraController autoRotate={false} />

          {/* 360 Background */}
          <Background360 />

          {/* Lighting */}
          <Lighting />

          {/* Gaming Setup Table */}
          <GamingSetup position={[-4.5, -14.6, 4.5]} scale={7} />

          {/* Use SimpleMachine instead of MachineModel for now */}
          {/* <SimpleMachine systemStatus={systemStatus} /> */}
          <MachineModel
            systemStatus={systemStatus}
            elevatorIndicatorRef={elevatorIndicatorRef}
            elevatorLightRef={elevatorLightRef}
            position={[1, 6.8, -7.5]}
          />

          {/* Elevator position and sensor indicators */}
          <ElevatorIndicators
            modelPosition={[-2, 7.17, -8.5]}
            modelScale={15}
            sphereRef={elevatorIndicatorRef}
            lightRef={elevatorLightRef}
          />

          {/* 3D Floating Cards */}
          <FloatingCards modelPosition={[-2.5, 6.5, -6.5]} modelScale={15} />

          {/* LED Strip around machine */}
          <LEDStripVisualization modelPosition={[-2.05, 6.55, -6.5]} modelScale={15} />
        </Suspense>
      </Canvas>

      <Loader
        containerStyles={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        innerStyles={{
          backgroundColor: 'hsl(var(--primary))',
          width: '100px',
          height: '4px',
        }}
        barStyles={{
          backgroundColor: 'hsl(var(--primary))',
          height: '100%',
        }}
        dataStyles={{
          color: 'hsl(var(--foreground))',
          fontSize: '14px',
          fontFamily: 'monospace',
        }}
      />
    </div>
  )
}
