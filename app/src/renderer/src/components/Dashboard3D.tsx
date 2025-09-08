import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useAppStore } from '../store/appStore'
import { MachineControls } from './MachineControls'

function LoadCell({
  position,
  isActive,
  weight,
}: {
  position: [number, number, number]
  isActive: boolean
  weight: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y += delta * 0.5
      // Add pulsing effect when active
      meshRef.current.scale.y = 1 + Math.sin(Date.now() * 0.002) * 0.05
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
      <cylinderGeometry args={[0.3, 0.3, 0.2]} />
      <meshStandardMaterial
        color={isActive ? '#00ff00' : '#888888'}
        emissive={isActive ? '#00ff00' : '#000000'}
        emissiveIntensity={isActive ? 0.4 : 0}
        metalness={0.3}
        roughness={0.4}
      />
      {weight > 0 && (
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#4444ff" />
        </mesh>
      )}
    </mesh>
  )
}

function Motor({
  position,
  isRunning,
}: {
  position: [number, number, number]
  isRunning: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    if (meshRef.current && isRunning) {
      meshRef.current.rotation.z += delta * 3
      // Add vibration effect
      meshRef.current.position.x = Math.sin(Date.now() * 0.01) * 0.02
      meshRef.current.position.y = Math.cos(Date.now() * 0.01) * 0.02
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <boxGeometry args={[0.6, 0.6, 0.4]} />
        <meshStandardMaterial
          color={isRunning ? '#ff8800' : '#333333'}
          emissive={isRunning ? '#ff4400' : '#000000'}
          emissiveIntensity={isRunning ? 0.3 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1]} />
        <meshStandardMaterial color="#666666" metalness={0.9} />
      </mesh>
    </group>
  )
}

function Solenoid({ position, isOpen }: { position: [number, number, number]; isOpen: boolean }) {
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.1 : 1}
      >
        <boxGeometry args={[0.3, 0.5, 0.3]} />
        <meshStandardMaterial
          color={isOpen ? '#00ffff' : '#555555'}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, isOpen ? 0.4 : 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2]} />
        <meshStandardMaterial color="#999999" metalness={0.9} />
      </mesh>
    </group>
  )
}

function MachineBase() {
  return (
    <group>
      {/* Main platform */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[8, 0.2, 6]} />
        <meshStandardMaterial color="#222222" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Support columns */}
      {[
        [-3.5, 0, -2.5],
        [3.5, 0, -2.5],
        [-3.5, 0, 2.5],
        [3.5, 0, 2.5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.3, 2, 0.3]} />
          <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Top frame */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[8, 0.1, 6]} />
        <meshStandardMaterial
          color="#222222"
          metalness={0.7}
          roughness={0.3}
          opacity={0.3}
          transparent
        />
      </mesh>
    </group>
  )
}

export function Dashboard3D({
  systemStatus,
  onSendCommand,
}: {
  systemStatus: any
  onSendCommand: (cmd: string) => Promise<void>
}) {
  const store = useAppStore()

  // Sync with app state
  useEffect(() => {
    const isConnected = systemStatus.state !== '0_INICIO'
    if (store.isConnected !== isConnected) {
      store.setConnected(isConnected)
    }
    if (store.machineState !== systemStatus.state) {
      store.setMachineState(systemStatus.state)
    }
    // Simulate some load cell readings based on weight
    if (systemStatus.weight > 0) {
      const baseWeight = systemStatus.weight / 9
      for (let i = 0; i < 9; i++) {
        store.setLoadCellReading(i, Math.random() * baseWeight * 2)
      }
    }
  }, [systemStatus.state, systemStatus.weight])

  const { isConnected, machineState, loadCellReadings, motorsStatus, solenoidsStatus } = store

  const [simulationMode, setSimulationMode] = useState(true)

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 160px)' }}>
      {/* 3D View */}
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0f0f0f',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[10, 8, 10]} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={30}
          />

          {/* Enhanced Lighting */}
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 15, 5]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight position={[-10, 10, -5]} intensity={0.4} />
          <pointLight position={[0, 5, 0]} intensity={0.3} color="#ffeedd" />
          <spotLight position={[5, 10, 5]} angle={0.3} penumbra={0.5} intensity={0.5} castShadow />

          <Suspense fallback={null}>
            <MachineBase />

            {/* Load Cells */}
            <group position={[0, -0.7, 0]}>
              <LoadCell
                position={[-2, 0, -1.5]}
                isActive={isConnected}
                weight={loadCellReadings[0]}
              />
              <LoadCell
                position={[0, 0, -1.5]}
                isActive={isConnected}
                weight={loadCellReadings[1]}
              />
              <LoadCell
                position={[2, 0, -1.5]}
                isActive={isConnected}
                weight={loadCellReadings[2]}
              />
              <LoadCell position={[-2, 0, 0]} isActive={isConnected} weight={loadCellReadings[3]} />
              <LoadCell position={[0, 0, 0]} isActive={isConnected} weight={loadCellReadings[4]} />
              <LoadCell position={[2, 0, 0]} isActive={isConnected} weight={loadCellReadings[5]} />
              <LoadCell
                position={[-2, 0, 1.5]}
                isActive={isConnected}
                weight={loadCellReadings[6]}
              />
              <LoadCell
                position={[0, 0, 1.5]}
                isActive={isConnected}
                weight={loadCellReadings[7]}
              />
              <LoadCell
                position={[2, 0, 1.5]}
                isActive={isConnected}
                weight={loadCellReadings[8]}
              />
            </group>

            {/* Motors */}
            <group position={[0, 0.5, 0]}>
              <Motor position={[-3, 0, 0]} isRunning={motorsStatus.motor1} />
              <Motor position={[3, 0, 0]} isRunning={motorsStatus.motor2} />
            </group>

            {/* Solenoids */}
            <group position={[0, 0, 3]}>
              <Solenoid position={[-1.5, 0, 0]} isOpen={solenoidsStatus.solenoid1} />
              <Solenoid position={[0, 0, 0]} isOpen={solenoidsStatus.solenoid2} />
              <Solenoid position={[1.5, 0, 0]} isOpen={solenoidsStatus.solenoid3} />
            </group>
          </Suspense>

          <gridHelper args={[20, 20]} position={[0, -1.1, 0]} />
          <fog attach="fog" args={['#1a1a1a', 10, 50]} />
        </Canvas>
      </div>

      {/* Shared Machine Controls */}
      <MachineControls
        onSendCommand={onSendCommand}
        simulationMode={simulationMode}
        onSimulationModeChange={setSimulationMode}
      />

      {/* Status Panel */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'rgba(26, 26, 26, 0.85)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: 20,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          minWidth: 280,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'white' }}>Machine Status</h3>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              background: isConnected ? '#10b981' : '#ef4444',
              boxShadow: isConnected ? '0 0 8px #10b981' : 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <StatusRow label="State" value={machineState} color="#60a5fa" />
          <StatusRow label="Progress" value={`${systemStatus.pillCount}/${systemStatus.targetPills}`} />
          <StatusRow label="Weight" value={`${systemStatus.weight}g`} color="#10b981" />
          <StatusRow label="Active Cells" value={`${loadCellReadings.filter((w) => w > 0).length}/9`} />
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              height: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%)',
                borderRadius: 3,
                width: `${Math.min((systemStatus.pillCount / systemStatus.targetPills) * 100, 100)}%`,
                transition: 'width 0.5s ease-out',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {Math.round((systemStatus.pillCount / systemStatus.targetPills) * 100)}%
            </span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{systemStatus.pillCount} pills</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const StatusRow = ({ label, value, color = 'white' }: { label: string; value: string; color?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: 14, color: '#9ca3af' }}>{label}</span>
    <span style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 500, color }}>{value}</span>
  </div>
)
