import { useFrame } from '@react-three/fiber'
import React, { useRef } from 'react'
import * as THREE from 'three'

interface AnimationControllerProps {
  systemStatus: {
    state: string
    sensors: {
      posAlta: boolean
      posBaja: boolean
    }
    stateProgress?: number
  }
  elevatorRef: React.MutableRefObject<THREE.Object3D | null>
  wheelRef: React.MutableRefObject<THREE.Object3D | null>
  grinderRef: React.MutableRefObject<THREE.Object3D | null>
  capperRef: React.MutableRefObject<THREE.Object3D | null>
  solenoidRef: React.MutableRefObject<THREE.Object3D | null>
}

export const AnimationController: React.FC<AnimationControllerProps> = (props) => {
  const { systemStatus, elevatorRef, wheelRef, grinderRef, capperRef, solenoidRef } = props

  const animationState = useRef({
    elevatorY: 0,
    wheelRotation: 0,
    grinderRotation: 0,
    capperPosition: 0,
    solenoidScale: 1,
  })

  useFrame((state, delta) => {
    const { state: currentState, sensors } = systemStatus

    // Elevator animation
    if (elevatorRef.current) {
      const targetY = sensors.posAlta ? 2 : sensors.posBaja ? -2 : 0
      animationState.current.elevatorY = THREE.MathUtils.lerp(
        animationState.current.elevatorY,
        targetY,
        delta * 2
      )
      elevatorRef.current.position.y = animationState.current.elevatorY
    }

    // Wheel rotation during dosing
    if (wheelRef.current) {
      if (currentState.includes('DOSIFICA')) {
        animationState.current.wheelRotation += delta * 2
        wheelRef.current.rotation.y = animationState.current.wheelRotation
      }
    }

    // Grinder rotation during grinding
    if (grinderRef.current) {
      if (currentState.includes('MOLIENDO')) {
        animationState.current.grinderRotation += delta * 10
        grinderRef.current.rotation.y = animationState.current.grinderRotation

        // Add vibration effect
        grinderRef.current.position.y = Math.sin(state.clock.elapsedTime * 50) * 0.01
        grinderRef.current.position.z = Math.cos(state.clock.elapsedTime * 50) * 0.01
      } else {
        // Reset position
        grinderRef.current.position.x = 0
        grinderRef.current.position.z = 0
      }
    }

    // Capper movement during capping
    if (capperRef.current) {
      if (currentState.includes('TAPANDO')) {
        const targetPos = Math.sin(state.clock.elapsedTime * 3) * 0.5 - 0.5
        animationState.current.capperPosition = THREE.MathUtils.lerp(
          animationState.current.capperPosition,
          targetPos,
          delta * 3
        )
        capperRef.current.position.y = animationState.current.capperPosition
      } else {
        animationState.current.capperPosition = THREE.MathUtils.lerp(
          animationState.current.capperPosition,
          0,
          delta * 2
        )
        capperRef.current.position.y = animationState.current.capperPosition
      }
    }

    // Solenoid pulse effect during transfer
    if (solenoidRef.current) {
      if (currentState.includes('TRANSFER')) {
        const pulse = Math.sin(state.clock.elapsedTime * 5) * 0.1 + 1
        animationState.current.solenoidScale = pulse
        solenoidRef.current.scale.setScalar(animationState.current.solenoidScale)
      } else {
        animationState.current.solenoidScale = THREE.MathUtils.lerp(
          animationState.current.solenoidScale,
          1,
          delta * 2
        )
        solenoidRef.current.scale.setScalar(animationState.current.solenoidScale)
      }
    }
  })

  return null
}
