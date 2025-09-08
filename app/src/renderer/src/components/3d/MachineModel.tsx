const MODEL_URL = '/lotech-model.gltf'
import { useGLTF } from '@react-three/drei'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Group } from 'three'
import { AnimationController } from './AnimationController'

interface MachineModelProps {
  systemStatus: {
    state: string
    sensors: {
      posAlta: boolean
      posBaja: boolean
    }
    pillCount: number
    targetPills: number
    weight?: number
    stateProgress?: {
      state: string
      expectedDuration: number
      startTime: number
    }
  }
}

export const MachineModel: React.FC<MachineModelProps> = (props) => {
  const { systemStatus } = props
  const { scene, nodes } = useGLTF(MODEL_URL)
  const groupRef = useRef<Group>(null)

  const elevatorRef = useRef<THREE.Object3D>(null!)
  const wheelRef = useRef<THREE.Object3D>(null!)
  const grinderRef = useRef<THREE.Object3D>(null!)
  const capperRef = useRef<THREE.Object3D>(null!)
  const solenoidRef = useRef<THREE.Object3D>(null!)

  useEffect(() => {
    elevatorRef.current = nodes['Ascensor_Platform']
    wheelRef.current = nodes['Dosificador_Disco']
    grinderRef.current = nodes['Molino_Tapa']
    capperRef.current = nodes['Frasco_Tapa']
    solenoidRef.current = nodes['Solenoide1_Vastago']
  }, [nodes])

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[0.8, 0.8, 0.8]} />
      <AnimationController
        systemStatus={systemStatus}
        elevatorRef={elevatorRef}
        wheelRef={wheelRef}
        grinderRef={grinderRef}
        capperRef={capperRef}
        solenoidRef={solenoidRef}
      />
    </group>
  )
}

// Preload the model
useGLTF.preload(MODEL_URL)
