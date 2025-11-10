import { useFrame } from '@react-three/fiber'
import { THREE_COLORS } from '@renderer/constants/theme'
import { DosingStatus } from '@renderer/serial'
import { useAppStore } from '@renderer/store/appStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useRef } from 'react'
import * as THREE from 'three'
import { MachineState, SystemStatus } from '../../types'
import {
  applyPulseEffect,
  applyPulseToChildren,
  calculateElevatorPosition,
  shouldAnimateCapper,
  shouldAnimateDosing,
  shouldAnimateElevator,
  shouldAnimateGrinder,
  shouldAnimateLoadCell,
  shouldAnimateTransfer,
  smoothLerp,
} from './animation/animationUtils'
import {
  ELEVATOR_MAX_HEIGHT,
  GRINDER_KNIFE_SPEED,
  WHEEL_ROTATION_SPEED,
} from './animation/constants'
import {
  AnimationCheckParams,
  AnimationRefs,
  AnimationState,
  ElevatorCalculationParams,
  LerpParams,
  PulseEffectParams,
} from './animation/types'

interface AnimationControllerProps extends AnimationRefs {
  systemStatus: SystemStatus
}

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
    elevatorIndicatorRef,
    elevatorLightRef,
  } = props

  const animationState = useRef<AnimationState>({
    containerZ: 0,
    elevatorY: 0,
    wheelRotation: 0,
    wheelTargetRotation: 0,
    grinderRotation: 0,
    grinderKnifeRotation: 0,
    capperPosition: 0,
    solenoidScale: 1,
    lastDosingState: DosingStatus.IDLE,
    elevatorTarget: 0,
    lastProximityDistance: 0,
    isDosingMotorMoving: false,
    dosingStepCount: 0,
    smoothedElevatorTarget: 0,
  })

  const testMode = useAppStore((state) => state.testMode)
  const currentDosing = useAppStore((state) => state.currentDosing)
  const proximityDistance = useControllerStateStore(
    (state) => state.sensorReadings.proximityDistance
  )
  const proximity = useSettingsStore((state) => state.proximity)
  const dosingSettings = useSettingsStore((state) => state.dosing)

  // Track if position has been initialized
  const positionInitializedRef = React.useRef(false)

  useFrame((state, delta) => {
    const { state: currentState, hardware } = systemStatus

    // Clamp delta to prevent huge jumps when app regains focus after being in background
    const clampedDelta = Math.min(delta, 0.1) // Max 100ms

    // Create check params for animation decisions
    const checkParams: AnimationCheckParams = {
      systemStatus,
      testMode,
      currentState,
    }

    // Calculate elevator position - DIRECT POSITION
    // Only calculate if we have valid proximity data

    const elevatorParams: ElevatorCalculationParams = {
      proximityDistance,
      minProximity: proximity.minProximity,
      maxProximity: proximity.maxProximity,
      maxHeight: ELEVATOR_MAX_HEIGHT,
    }

    // Get target position
    const targetPosition = proximityDistance > 0 ? calculateElevatorPosition(elevatorParams) : 0

    // Initialize position on first valid data (skip lerp)
    if (
      !positionInitializedRef.current &&
      proximityDistance > 0 &&
      proximity.minProximity > 0 &&
      proximity.maxProximity > 0 &&
      containerRef.current &&
      elevatorRef.current
    ) {
      animationState.current.elevatorY = targetPosition
      animationState.current.containerZ = -targetPosition
      elevatorRef.current.position.y = targetPosition
      containerRef.current.position.z = -targetPosition
      positionInitializedRef.current = true
      console.log('[ELEVATOR] Initialized position directly:', targetPosition)
      return // Skip rest of animation for this frame
    }

    // Animate elevator and container together as a solid unit - SAME LERP
    const shouldPulse = shouldAnimateElevator(checkParams)

    // Calculate single lerped position for both (they move together)
    const lerpParams: LerpParams = {
      current: animationState.current.elevatorY,
      target: targetPosition,
      delta: clampedDelta,
      speed: 1, // Unified speed for both elevator and container (increased for more responsive animation)
    }
    const newPosition = smoothLerp(lerpParams)
    animationState.current.elevatorY = newPosition
    animationState.current.containerZ = -newPosition

    // Apply to elevator
    if (elevatorRef.current) {
      const pulseParams: PulseEffectParams = {
        object: elevatorRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }

      applyPulseEffect(pulseParams)
      elevatorRef.current.position.y = newPosition
    }

    // Apply to container (moves opposite direction)
    if (containerRef.current) {
      applyPulseToChildren(containerRef.current, shouldPulse, state.clock.elapsedTime)
      containerRef.current.position.z = -newPosition
    }

    // Apply to elevator indicator sphere - uses SAME position as elevator
    if (elevatorIndicatorRef?.current) {
      const sensorReadings = useControllerStateStore.getState().sensorReadings
      const isAtBottom = sensorReadings.posBaja
      const isAtTop = sensorReadings.posAlta
      const atLimit = isAtTop || isAtBottom

      // Colors for active/inactive states
      const activeColor = new THREE.Color(THREE_COLORS.indicators.active)
      const dimColor = new THREE.Color(THREE_COLORS.indicators.inactive)

      // Calculate indicator Y position from same elevator position
      // Position is relative to the sphere's parent group (which is already at baseY)
      const indicatorY = newPosition / 65

      elevatorIndicatorRef.current.position.y = indicatorY

      // Update sphere color and glow based on position
      const material = elevatorIndicatorRef.current.material as THREE.MeshStandardMaterial
      material.color.copy(atLimit ? activeColor : dimColor)
      material.emissive.copy(atLimit ? activeColor : dimColor)
      material.emissiveIntensity = atLimit ? 1 : 0.5

      if (elevatorLightRef?.current) {
        elevatorLightRef.current.intensity = atLimit ? 0.1 : 0
      }
    }

    // Animate dosing wheel
    if (wheelRef.current) {
      const shouldPulse = shouldAnimateDosing(checkParams)
      const pulseParams: PulseEffectParams = {
        object: wheelRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)

      // Calculate rotation based on wheel settings
      const degreesPerDivision = 360 / currentDosing.wheelDivisions
      const radiansPerDivision = (degreesPerDivision * Math.PI) / 180

      // Handle different dosing states
      if (hardware) {
        // Check dosing status
        const dosingStatus = hardware.dosing

        if (dosingStatus === DosingStatus.FWD) {
          // Continuous forward rotation
          // Speed matches motor speed setting (default 2.0 rad/s)
          const motorSpeed = dosingSettings.motorSpeed || 1.0
          animationState.current.wheelRotation += clampedDelta * motorSpeed
          animationState.current.lastDosingState = DosingStatus.FWD
        } else if (dosingStatus === DosingStatus.BWD) {
          // Continuous backward rotation
          const motorSpeed = dosingSettings.motorSpeed || 1.0
          animationState.current.wheelRotation -= clampedDelta * motorSpeed
          animationState.current.lastDosingState = DosingStatus.BWD
        } else if (dosingStatus === DosingStatus.STEP || dosingStatus === DosingStatus.ONE_PILL) {
          // Single step rotation for one pill
          if (
            animationState.current.lastDosingState !== DosingStatus.STEP &&
            animationState.current.lastDosingState !== DosingStatus.ONE_PILL
          ) {
            // New pill dispense - set target
            animationState.current.wheelTargetRotation =
              animationState.current.wheelRotation + radiansPerDivision
            animationState.current.lastDosingState = dosingStatus
          }

          // Smoothly rotate to target
          if (
            Math.abs(
              animationState.current.wheelRotation - animationState.current.wheelTargetRotation
            ) > 0.01
          ) {
            const lerpParams: LerpParams = {
              current: animationState.current.wheelRotation,
              target: animationState.current.wheelTargetRotation,
              delta: clampedDelta,
              speed: 1.5, // Faster for single pill
            }
            animationState.current.wheelRotation = smoothLerp(lerpParams)
          }
        } else if (dosingStatus === DosingStatus.IDLE || dosingStatus === DosingStatus.STOPPED) {
          // Motor stopped - maintain position
          animationState.current.lastDosingState = DosingStatus.IDLE
        }
      } else if (currentState === MachineState.DOSIFICACION) {
        // In automatic dosing state (no hardware status)
        // Rotate one step per state entry
        const currentStep = Math.floor(animationState.current.wheelRotation / radiansPerDivision)
        if (currentStep < animationState.current.dosingStepCount + 1) {
          // Rotate to next position
          const targetRotation = (animationState.current.dosingStepCount + 1) * radiansPerDivision
          const lerpParams: LerpParams = {
            current: animationState.current.wheelRotation,
            target: targetRotation,
            delta: clampedDelta,
            speed: WHEEL_ROTATION_SPEED,
          }
          animationState.current.wheelRotation = smoothLerp(lerpParams)

          // Update step count when we reach the target
          if (Math.abs(animationState.current.wheelRotation - targetRotation) < 0.01) {
            animationState.current.dosingStepCount++
          }
        }
      }

      wheelRef.current.rotation.z = animationState.current.wheelRotation
    }

    // Animate grinder
    if (grinderRef.current) {
      const shouldPulse = shouldAnimateGrinder(checkParams)
      const pulseParams: PulseEffectParams = {
        object: grinderRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)
    }

    // Animate grinder knife
    if (grinderKnifeRef.current) {
      const shouldPulse = shouldAnimateGrinder(checkParams)
      const pulseParams: PulseEffectParams = {
        object: grinderKnifeRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)

      if (shouldPulse) {
        animationState.current.grinderKnifeRotation += clampedDelta * GRINDER_KNIFE_SPEED
      }

      grinderKnifeRef.current.rotation.y = animationState.current.grinderKnifeRotation
    }

    // Animate capper
    if (capperRef.current) {
      const shouldPulse = shouldAnimateCapper(checkParams)
      const pulseParams: PulseEffectParams = {
        object: capperRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)
    }

    // Animate load cell
    if (loadCellRef.current) {
      const shouldPulse = shouldAnimateLoadCell(currentState)
      const pulseParams: PulseEffectParams = {
        object: loadCellRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)
    }

    // Animate solenoid
    if (solenoidRef.current) {
      const shouldPulse = shouldAnimateTransfer(checkParams)
      const pulseParams: PulseEffectParams = {
        object: solenoidRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)
    }
  })

  return null
}
