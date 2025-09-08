import { useGLTF } from '@react-three/drei'
import type { SystemStatus } from '@renderer/types'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Group } from 'three'
import { AnimationController } from './AnimationController'

const MODEL_URL = '/model.glb'
interface MachineModelProps {
  systemStatus: SystemStatus
}

export const MachineModel: React.FC<MachineModelProps> = (props) => {
  const { systemStatus } = props
  const { scene, nodes } = useGLTF(MODEL_URL)
  const groupRef = useRef<Group>(null)

  const elevatorRef = useRef<THREE.Object3D>(null!)
  const containerRef = useRef<THREE.Object3D>(null!)

  const wheelRef = useRef<THREE.Object3D>(null!)
  const grinderRef = useRef<THREE.Object3D>(null!)
  const capperRef = useRef<THREE.Object3D>(null!)
  const solenoidRef = useRef<THREE.Object3D>(null!)
  const loadCellRef = useRef<THREE.Object3D>(null!)

  useEffect(() => {
    elevatorRef.current = nodes['Body3005']
    containerRef.current = nodes['Frasco_FINAL_ABSOLUTO_318_v5']
    wheelRef.current = nodes['Ruleta_Termoformada']
    grinderRef.current = nodes['Carcasa_Motor']
    capperRef.current = nodes['Body1048']
    solenoidRef.current = nodes['Body1020']
    loadCellRef.current = nodes['Body1051']
  }, [nodes])

  return (
    <group ref={groupRef} position={[3, 0, -1]}>
      <primitive object={scene} scale={[15, 15, 15]} />
      <AnimationController
        systemStatus={systemStatus}
        elevatorRef={elevatorRef}
        containerRef={containerRef}
        wheelRef={wheelRef}
        grinderRef={grinderRef}
        capperRef={capperRef}
        solenoidRef={solenoidRef}
        loadCellRef={loadCellRef}
      />
    </group>
  )
}

// Preload the model
useGLTF.preload(MODEL_URL)
