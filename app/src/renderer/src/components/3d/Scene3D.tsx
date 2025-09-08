import { Grid, Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useAppStore } from '@renderer/store/appStore'
import React, { Suspense } from 'react'
import { SystemStatus } from '../../types'
import { CameraController } from './CameraController'
import { Lighting } from './Lighting'
import { MachineModel } from './MachineModel'
import { StatusDisplay } from './StatusDisplay'

interface Scene3DProps {
  systemStatus: SystemStatus
  onSendCommand: (command: string) => void
}

export const Scene3D: React.FC<Scene3DProps> = (props) => {
  const { systemStatus } = props
  const { isConnected } = useAppStore()
  return (
    <div className="from-background to-muted/20 relative h-[100vh] w-full overflow-hidden rounded-lg bg-gradient-to-b">
      <Canvas shadows camera={{ fov: 80 }}>
        <Suspense fallback={null}>
          <CameraController autoRotate={false} />
          <Lighting />

          {/* Grid floor */}
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor="#a3e635"
            sectionSize={5}
            sectionThickness={1}
            sectionColor="#84cc16"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
          />

          <StatusDisplay
            state={systemStatus.state}
            pillCount={systemStatus.pillCount}
            targetPills={systemStatus.targetPills}
            weight={systemStatus.weight}
            isConnected={isConnected}
          />
          {/* Use SimpleMachine instead of MachineModel for now */}
          {/* <SimpleMachine systemStatus={systemStatus} /> */}
          <MachineModel systemStatus={systemStatus} />
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
