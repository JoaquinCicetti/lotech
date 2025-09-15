import { useFrame } from '@react-three/fiber'
import { useAppStore } from '@renderer/store/appStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useRef } from 'react'
import * as THREE from 'three'
import { MachineState, SystemStatus } from '../../types'

interface AnimationControllerProps {
  systemStatus: SystemStatus
  elevatorRef: React.RefObject<THREE.Object3D | null>
  containerRef: React.RefObject<THREE.Object3D | null>
  wheelRef: React.RefObject<THREE.Object3D | null>
  grinderRef: React.RefObject<THREE.Object3D | null>
  grinderKnifeRef: React.RefObject<THREE.Object3D | null>
  capperRef: React.RefObject<THREE.Object3D | null>
  solenoidRef: React.RefObject<THREE.Object3D | null>
  loadCellRef: React.RefObject<THREE.Object3D | null>
}
const baseColor = new THREE.Color(0xfafafa)
const pulseColor = new THREE.Color(0x344496)

export const AnimationController: React.FC<AnimationControllerProps> = (props) => {
  const {
    systemStatus,
    elevatorRef,
    containerRef,
    wheelRef,
    grinderRef,
    grinderKnifeRef,
    capperRef,
    solenoidRef,
    loadCellRef,
  } = props

  const animationState = useRef({
    containerZ: 0,
    elevatorY: 0,
    wheelRotation: 0,
    wheelTargetRotation: 0,
    grinderRotation: 0,
    grinderKnifeRotation: 0,
    capperPosition: 0,
    solenoidScale: 1,
    lastDosingState: 'IDLE' as 'ACTIVE' | 'IDLE',
    elevatorTarget: 0, // Track where elevator is going
  })

  const testMode = useAppStore((state) => state.testMode)
  const currentDosing = useAppStore((state) => state.currentDosing)
  const proximityDistance = useControllerStateStore(
    (state) => state.sensorReadings.proximityDistance
  )
  const proximity = useSettingsStore((state) => state.proximity)

  console.log({ proximity, proximityDistance })
  useFrame((state, delta) => {
    const { state: currentState, hardware } = systemStatus

    // In test mode, use hardware status for animations
    const useHardwareStatus = testMode && hardware

    // Debug logging
    if (testMode && hardware && hardware.dosing) {
      if (hardware.dosing !== animationState.current.lastDosingState) {
        console.log(
          'Dosing state changed:',
          animationState.current.lastDosingState,
          '->',
          hardware.dosing
        )
      }
    }

    // Calculate elevator position based on proximity sensor
    const calculateElevatorPosition = () => {
      const { minProximity, maxProximity } = proximity

      if (proximityDistance <= minProximity) {
        return 0 // Bottom position
      } else if (proximityDistance >= maxProximity) {
        return 70 // Top position
      } else {
        // Map the distance to elevator position (0 to 70)
        // minProximity maps to 0 (bottom), maxProximity maps to 70 (top)
        const ratio = (proximityDistance - minProximity) / (maxProximity - minProximity)
        return ratio * 70
      }
    }

    // Elevator animation
    if (containerRef.current) {
      containerRef.current.children.forEach((child) => {
        if ('material' in child) {
          const material = child.material as THREE.MeshStandardMaterial

          const cloned = material.clone()
          child.material = cloned

          const shouldPulse = useHardwareStatus
            ? hardware.elevator === 'MOVING' ||
              hardware.elevator === 'MOVING_UP' ||
              hardware.elevator === 'MOVING_DOWN'
            : currentState === MachineState.ASCENSOR || currentState === MachineState.DESCARGA

          if (shouldPulse) {
            // Calculate a pulse factor from 0 to 1 based on elapsed time
            const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

            // Lerp between the base color and the pulse color
            cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
          } else {
            cloned.color.set(baseColor)
          }
        }
      })

      // Position based on hardware status or state
      // if (useHardwareStatus) {
      // Use proximity sensor to determine elevator position
      const targetZ = -calculateElevatorPosition() // Negative because container moves opposite to elevator

      animationState.current.containerZ = THREE.MathUtils.lerp(
        animationState.current.containerZ,
        targetZ,
        delta * 0.6
      )
      containerRef.current.position.z = animationState.current.containerZ
      // } else {
      //   if (currentState === MachineState.ASCENSOR) {
      //     animationState.current.containerZ = THREE.MathUtils.lerp(
      //       animationState.current.containerZ,
      //       -70,
      //       delta * 0.6
      //     )
      //     containerRef.current.position.z = animationState.current.containerZ
      //   }
      //   if (currentState === MachineState.DESCARGA) {
      //     animationState.current.containerZ = THREE.MathUtils.lerp(
      //       animationState.current.containerZ,
      //       0,
      //       delta * 0.6
      //     )
      //     containerRef.current.position.z = animationState.current.containerZ
      //   }
      // }
    }

    if (elevatorRef.current) {
      if ('material' in elevatorRef.current) {
        const material = elevatorRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        elevatorRef.current.material = cloned

        const shouldPulse = useHardwareStatus
          ? hardware.elevator === 'MOVING' ||
            hardware.elevator === 'MOVING_UP' ||
            hardware.elevator === 'MOVING_DOWN'
          : currentState === MachineState.ASCENSOR || currentState === MachineState.DESCARGA

        if (shouldPulse) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }

      // Position based on hardware status or state
      if (useHardwareStatus) {
        // Use proximity sensor to determine elevator position
        const targetY = calculateElevatorPosition()

        animationState.current.elevatorY = THREE.MathUtils.lerp(
          animationState.current.elevatorY,
          targetY,
          delta * 0.6
        )
        elevatorRef.current.position.y = animationState.current.elevatorY
      } else {
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
    }

    // Wheel rotation during dosing
    if (wheelRef.current) {
      if ('material' in wheelRef.current) {
        const material = wheelRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        wheelRef.current.material = cloned

        const shouldPulse = useHardwareStatus
          ? hardware.dosing === 'ACTIVE'
          : currentState === MachineState.DOSIFICACION

        if (shouldPulse) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }

      // Handle wheel rotation with discrete steps
      if (useHardwareStatus && hardware) {
        // Check if dosing state changed from IDLE to ACTIVE
        if (hardware.dosing === 'ACTIVE' && animationState.current.lastDosingState === 'IDLE') {
          // Calculate rotation for one division (in radians)
          const degreesPerDivision = 360 / currentDosing.wheelDivisions
          const radiansPerDivision = (degreesPerDivision * Math.PI) / 180
          animationState.current.wheelTargetRotation =
            animationState.current.wheelRotation + radiansPerDivision
          console.log('Dosing step triggered:', {
            divisions: currentDosing.wheelDivisions,
            degrees: degreesPerDivision,
            targetRotation: animationState.current.wheelTargetRotation,
          })
        }
        animationState.current.lastDosingState = hardware.dosing

        // Smoothly rotate to target
        if (
          Math.abs(
            animationState.current.wheelTargetRotation - animationState.current.wheelRotation
          ) > 0.01
        ) {
          animationState.current.wheelRotation = THREE.MathUtils.lerp(
            animationState.current.wheelRotation,
            animationState.current.wheelTargetRotation,
            delta * 3 // Adjust speed as needed
          )
        }
      } else if (currentState === MachineState.DOSIFICACION) {
        // In automatic mode, rotate continuously
        animationState.current.wheelRotation += delta * 0.1
      }

      wheelRef.current.rotation.z = animationState.current.wheelRotation
    }

    // Grinder rotation during grinding
    if (grinderRef.current) {
      if ('material' in grinderRef.current) {
        const material = grinderRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        grinderRef.current.material = cloned

        const shouldPulse = useHardwareStatus
          ? hardware.grinder === 'ON'
          : currentState === MachineState.MOLIENDA

        if (shouldPulse) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)
        } else {
          cloned.color.set(baseColor)
        }
      }
    }
    if (grinderKnifeRef.current) {
      if ('material' in grinderKnifeRef.current) {
        const material = grinderKnifeRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        grinderKnifeRef.current.material = cloned

        const shouldPulse = useHardwareStatus
          ? hardware.grinder === 'ON'
          : currentState === MachineState.MOLIENDA

        if (shouldPulse) {
          // Calculate a pulse factor from 0 to 1 based on elapsed time
          const pulseFactor = (Math.sin(state.clock.elapsedTime * 5) + 1) / 2

          // Lerp between the base color and the pulse color
          cloned.color.lerpColors(baseColor, pulseColor, pulseFactor)

          animationState.current.grinderKnifeRotation += delta * 50
        } else {
          cloned.color.set(baseColor)
        }

        grinderKnifeRef.current.rotation.y = animationState.current.grinderKnifeRotation
      }
    }

    // Capper movement during capping
    if (capperRef.current) {
      if ('material' in capperRef.current) {
        const material = capperRef.current.material as THREE.MeshStandardMaterial

        const cloned = material.clone()
        capperRef.current.material = cloned

        const shouldPulse = useHardwareStatus
          ? hardware.cap === 'PUSHED'
          : currentState === MachineState.CIERRE

        if (shouldPulse) {
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

        const shouldPulse = useHardwareStatus
          ? hardware.transfer === 'OPEN'
          : currentState === MachineState.TRASPASO

        if (shouldPulse) {
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
