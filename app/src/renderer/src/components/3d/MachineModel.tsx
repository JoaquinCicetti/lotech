import { useGLTF } from '@react-three/drei'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import type { SystemStatus } from '@renderer/types'
import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { Group } from 'three'
import { AnimationController } from './AnimationController'
import { calculateElevatorPosition } from './animation/animationUtils'
import { ELEVATOR_MAX_HEIGHT } from './animation/constants'

// const MODEL_URL = '/model.glb'
const MODEL_URL = new URL('../../assets/model.glb', import.meta.url).href

interface MachineModelProps {
  systemStatus: SystemStatus
  elevatorIndicatorRef?: React.RefObject<THREE.Mesh | null>
  elevatorLightRef?: React.RefObject<THREE.PointLight | null>
}

export const MachineModel: React.FC<MachineModelProps> = (props) => {
  const { systemStatus, elevatorIndicatorRef, elevatorLightRef } = props
  const { scene, nodes } = useGLTF(MODEL_URL)
  const groupRef = useRef<Group>(null)

  const elevatorRef = useRef<THREE.Object3D>(null!)
  const containerRef = useRef<THREE.Object3D>(null!)

  const wheelRef = useRef<THREE.Object3D>(null!)
  const grinderRef = useRef<THREE.Object3D>(null!)
  const grinderKnifeRef = useRef<THREE.Object3D>(null!)
  const capperRef = useRef<THREE.Object3D>(null!)
  const solenoidRef = useRef<THREE.Object3D>(null!)
  const loadCellRef = useRef<THREE.Object3D>(null!)

  const { sensorReadings } = useControllerStateStore()
  const { proximity } = useSettingsStore()

  useEffect(() => {
    elevatorRef.current = nodes['Body3005']
    containerRef.current = nodes['Frasco_FINAL_ABSOLUTO_318_v5']
    wheelRef.current = nodes['Ruleta_Termoformada']
    grinderRef.current = nodes['Carcasa_Motor']
    grinderKnifeRef.current = nodes['Body1017']
    capperRef.current = nodes['Body1048']
    solenoidRef.current = nodes['Body1020']
    loadCellRef.current = nodes['Body1051']

    // Initialize elevator position immediately if we have sensor data
    if (
      sensorReadings.proximityDistance > 0 &&
      proximity.minProximity > 0 &&
      proximity.maxProximity > 0
    ) {
      const initialPosition = calculateElevatorPosition({
        proximityDistance: sensorReadings.proximityDistance,
        minProximity: proximity.minProximity,
        maxProximity: proximity.maxProximity,
        maxHeight: ELEVATOR_MAX_HEIGHT,
      })

      if (elevatorRef.current) {
        elevatorRef.current.position.y = initialPosition
      }
      if (containerRef.current) {
        containerRef.current.position.z = -initialPosition
      }

      console.log('[MODEL] Pre-initialized elevator at:', initialPosition)
    }
  }, [nodes, sensorReadings.proximityDistance, proximity.minProximity, proximity.maxProximity])

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={[15, 15, 15]} />
      <AnimationController
        systemStatus={systemStatus}
        elevatorRef={elevatorRef}
        containerRef={containerRef}
        wheelRef={wheelRef}
        grinderRef={grinderRef}
        grinderKnifeRef={grinderKnifeRef}
        capperRef={capperRef}
        solenoidRef={solenoidRef}
        loadCellRef={loadCellRef}
        elevatorIndicatorRef={elevatorIndicatorRef}
        elevatorLightRef={elevatorLightRef}
      />
    </group>
  )
}

// Preload the model
useGLTF.preload(MODEL_URL)
