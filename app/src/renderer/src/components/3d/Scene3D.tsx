import { Grid, Loader } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { SCENE_COLORS } from '@renderer/constants/theme'
import React, { Suspense } from 'react'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { SystemStatus } from '../../types'
import { CameraController } from './CameraController'
import { ElevatorIndicators } from './ElevatorIndicators'
import { FloatingCards } from './FloatingCards'
import { LEDStripVisualization } from './LEDStripVisualization'
import { Lighting } from './Lighting'
import { MachineModel } from './MachineModel'

interface Scene3DProps {
  systemStatus: SystemStatus
}

// const DEFAULT_TARGET = new Vector3(0, 1, 0)

type CameraMode = 'orbit' | 'path'

const buildCurve = (points: number[][]) =>
  new CatmullRomCurve3(
    points.map((p) => new Vector3(p[0], p[1], p[2])),
    true,
    'catmullrom',
    0.5
  )

const PATHS: Record<string, CatmullRomCurve3> = {
  // Example states -> customize keys to match your SystemStatus.state values
  IDLE: buildCurve([
    [12, 6, 0],
    [8, 5, 8],
    [0, 6, 12],
    [-8, 5, 8],
    [-12, 6, 0],
    [-8, 5, -8],
    [0, 6, -12],
    [8, 5, -8],
  ]),
  RUNNING: buildCurve([
    [9, 8, 2],
    [6, 7, 9],
    [0, 8, 11],
    [-6, 7, 9],
    [-9, 8, 2],
    [-6, 7, -9],
    [0, 8, -11],
    [6, 7, -9],
  ]),
  ERROR: buildCurve([
    [7, 11, 0],
    [0, 12, 9],
    [-7, 11, 0],
    [0, 10, -9],
  ]),
}

interface CameraPathAnimatorProps {
  mode: CameraMode
  /** Scene focus */
  target?: [number, number, number]
  /** For orbit mode */
  radius?: number
  speed?: number // radians per second
  /** For path mode */
  stateKey?: string // SystemStatus.state
}

export const CameraPathAnimator: React.FC<CameraPathAnimatorProps> = ({
  mode,
  target = [0, 1, 0],
  radius = 12,
  speed = 0.15,
  stateKey = 'IDLE',
}) => {
  const { camera } = useThree()
  const tRef = React.useRef(0)
  const lastStateRef = React.useRef<string | null>(null)
  const targetV = React.useMemo(() => new Vector3(...target), [target])

  const curveRef = React.useRef<CatmullRomCurve3 | null>(null)

  React.useEffect(() => {
    if (mode === 'path') {
      // Swap to a new curve if stateKey changes
      const nextCurve = PATHS[stateKey] ?? PATHS.IDLE
      curveRef.current = nextCurve
      // Keep continuity by mapping current world position to closest point on the new curve
      // and setting tRef to that parametric value
      try {
        const samples = 256
        let bestT = 0
        let bestD = Infinity
        for (let i = 0; i <= samples; i++) {
          const u = i / samples
          const p = nextCurve.getPointAt(u)
          const d = p.distanceTo(camera.position)
          if (d < bestD) {
            bestD = d
            bestT = u
          }
        }
        tRef.current = bestT
      } catch (error) {
        console.error(error)
        tRef.current = 0
      }
      lastStateRef.current = stateKey
    }
  }, [mode, stateKey, camera])

  useFrame((_, delta) => {
    if (mode === 'orbit') {
      tRef.current += speed * delta
      const ang = tRef.current
      const x = targetV.x + Math.cos(ang) * radius
      const z = targetV.z + Math.sin(ang) * radius
      const y = targetV.y + radius * 0.35 + Math.sin(ang * 0.5) * (radius * 0.08)
      camera.position.set(x, y, z)
      camera.lookAt(targetV)
    } else if (mode === 'path' && curveRef.current) {
      // Advance along the curve at ~speed radians/sec mapped to path length
      const advance = MathUtils.clamp(speed * delta, 0, 0.5)
      tRef.current = (tRef.current + advance) % 1
      const p = curveRef.current.getPointAt(tRef.current)
      const tangent = curveRef.current.getTangentAt(tRef.current)
      camera.position.lerp(p, 0.2)
      const look = new Vector3().copy(p).addScaledVector(tangent.normalize(), 2)
      camera.lookAt(look.lerp(targetV, 0.5))
    }
  })

  return null
}

export const Scene3D: React.FC<Scene3DProps> = (props) => {
  const { systemStatus } = props

  return (
    <div
      className="relative h-[100vh] w-full overflow-hidden rounded-lg"
      style={{
        background: `linear-gradient(to bottom, ${SCENE_COLORS.background.gradient.from}, ${SCENE_COLORS.background.gradient.via}, ${SCENE_COLORS.background.gradient.to})`,
      }}
    >
      <Canvas shadows camera={{ fov: 50, position: [8, 6, 8] }}>
        <Suspense fallback={null}>
          <CameraController autoRotate={false} />
          {/* <CameraPathAnimator
            mode={currentDosing?.lotSize ? 'path' : 'orbit'}
            stateKey={systemStatus.state as unknown as string}
          /> */}

          {/* Lighting */}
          <Lighting />

          {/* Fog for depth */}
          <fog attach="fog" args={[SCENE_COLORS.background.fog, 10, 35]} />

          {/* Ground plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial
              color={SCENE_COLORS.ground.base}
              roughness={0.3}
              metalness={0.4}
            />
          </mesh>

          {/* Grid floor */}
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellThickness={0.5}
            cellColor={SCENE_COLORS.ground.grid.cell}
            sectionSize={5}
            sectionThickness={1}
            sectionColor={SCENE_COLORS.ground.grid.section}
            fadeDistance={25}
            fadeStrength={1}
            position={[0, -0.49, 0]}
          />

          {/* Use SimpleMachine instead of MachineModel for now */}
          {/* <SimpleMachine systemStatus={systemStatus} /> */}
          <MachineModel systemStatus={systemStatus} />

          {/* Elevator position and sensor indicators */}
          <ElevatorIndicators modelPosition={[-3, 0.4, -1]} modelScale={15} />

          {/* 3D Floating Cards */}
          <FloatingCards modelPosition={[-3, 0, 0]} modelScale={15} />

          {/* LED Strip around machine */}
          <LEDStripVisualization modelPosition={[-3, -0.2, 0.95]} modelScale={15} />
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
