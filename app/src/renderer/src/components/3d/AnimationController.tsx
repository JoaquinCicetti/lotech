import { useFrame } from '@react-three/fiber'
import React, { useRef } from 'react'
import * as THREE from 'three'
import { MachineState, SystemStatus } from '../../types'

interface AnimationControllerProps {
  systemStatus: Pick<SystemStatus, 'state' | 'sensors' | 'stateProgress'>
  elevatorRef: React.RefObject<THREE.Object3D | null>
  containerRef: React.RefObject<THREE.Object3D | null>
  wheelRef: React.RefObject<THREE.Object3D | null>
  grinderRef: React.RefObject<THREE.Object3D | null>
  capperRef: React.RefObject<THREE.Object3D | null>
  solenoidRef: React.RefObject<THREE.Object3D | null>
  loadCellRef: React.RefObject<THREE.Object3D | null>
}
const baseColor = new THREE.Color(0x808080)
const pulseColor = new THREE.Color(0xbef264)

export const AnimationController: React.FC<AnimationControllerProps> = (props) => {
  const {
    systemStatus,
    elevatorRef,
    containerRef,
    wheelRef,
    grinderRef,
    capperRef,
    solenoidRef,
    loadCellRef,
  } = props

  const animationState = useRef({
    containerZ: 0,
    elevatorY: 0,
    wheelRotation: 0,
    grinderRotation: 0,
    capperPosition: 0,
    solenoidScale: 1,
  })

  useFrame((state, delta) => {
    const { state: currentState } = systemStatus

    // Elevator animation
    if (containerRef.current) {
      containerRef.current.children.forEach((child) => {
        if ('material' in child) {
          const material = child.material as THREE.MeshStandardMaterial

          const cloned = material.clone()
          child.material = cloned

          if (currentState === MachineState.ASCENSOR || currentState === MachineState.DESCARGA) {
            // Calculate a pulse factor from 0 to 1 based on elapsed time
            const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

            // Lerp between the base color and the pulse color
            cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
          } else {
            cloned.color.set(baseColor)
          }
        }
      })

      if (currentState === MachineState.ASCENSOR) {
        animationState.current.containerZ = THREE.MathUtils.lerp(
          animationState.current.containerZ,
          -70,
          delta * 0.6
        )
        containerRef.current.position.z = animationState.current.containerZ
      }
      if (currentState === MachineState.DESCARGA) {
        animationState.current.containerZ = THREE.MathUtils.lerp(
          animationState.current.containerZ,
          0,
          delta * 0.6
        )

        containerRef.current.position.z = animationState.current.containerZ
      }
    }

    if (elevatorRef.current) {
      if ('material' in elevatorRef.current) {
        const material = elevatorRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        elevatorRef.current.material = cloned

        if (currentState === MachineState.ASCENSOR || currentState === MachineState.DESCARGA) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }

      if (currentState === MachineState.ASCENSOR) {
        animationState.current.elevatorY = THREE.MathUtils.lerp(
          animationState.current.elevatorY,
          70,
          delta * 0.6
        )
        elevatorRef.current.position.y = animationState.current.elevatorY
      }
      if (currentState === MachineState.DESCARGA) {
        animationState.current.elevatorY = THREE.MathUtils.lerp(
          animationState.current.elevatorY,
          0,
          delta * 0.6
        )

        elevatorRef.current.position.y = animationState.current.elevatorY
      }
    }

    // Wheel rotation during dosing
    if (wheelRef.current) {
      if ('material' in wheelRef.current) {
        const material = wheelRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        wheelRef.current.material = cloned

        if (currentState === MachineState.DOSIFICACION) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }

      if (currentState === MachineState.DOSIFICACION) {
        animationState.current.wheelRotation += delta * 0.1
        wheelRef.current.rotation.z = animationState.current.wheelRotation
      }
    }

    // Grinder rotation during grinding
    if (grinderRef.current) {
      if ('material' in grinderRef.current) {
        const material = grinderRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        grinderRef.current.material = cloned

        if (currentState === MachineState.MOLIENDA) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }
    }

    // Capper movement during capping
    if (capperRef.current) {
      if ('material' in capperRef.current) {
        const material = capperRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        capperRef.current.material = cloned

        if (currentState === MachineState.CIERRE) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }
    }

    // Load cell during weight measurement
    if (loadCellRef.current) {
      if ('material' in loadCellRef.current) {
        const material = loadCellRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        loadCellRef.current.material = cloned

        if (currentState === MachineState.PESAJE) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }
    }

    // Solenoid pulse effect during transfer
    if (solenoidRef.current) {
      const solenoidMesh = solenoidRef.current as THREE.Mesh

      if (solenoidMesh && solenoidMesh.material) {
        const material = solenoidMesh.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        solenoidMesh.material = cloned

        if (currentState === MachineState.TRASPASO) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }
    }
  })

  return null
}
