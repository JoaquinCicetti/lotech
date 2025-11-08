import { useFrame } from '@react-three/fiber'
import { DosingStatus } from '@renderer/serial'
import { useAppStore } from '@renderer/store/appStore'
import { useControllerStateStore } from '@renderer/store/controllerStateStore'
import { useSettingsStore } from '@renderer/store/settingsStore'
import React, { useRef } from 'react'
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
    smoothedElevatorTarget: 0, // Smoothed target to prevent jumps
  })

  const testMode = useAppStore((state) => state.testMode)
  const currentDosing = useAppStore((state) => state.currentDosing)
  const proximityDistance = useControllerStateStore(
    (state) => state.sensorReadings.proximityDistance
  )
  const proximity = useSettingsStore((state) => state.proximity)
  const dosingSettings = useSettingsStore((state) => state.dosing)

  // Track if refs are ready and initialized
  const refsReadyRef = React.useRef(false)
  const positionInitializedRef = React.useRef(false)

  React.useEffect(() => {
    // Check if refs are ready
    if (elevatorRef.current && containerRef.current) {
      refsReadyRef.current = true

      // Initialize position once when we have valid sensor data
      if (
        !positionInitializedRef.current &&
        proximityDistance > 0 &&
        proximity.minProximity > 0 &&
        proximity.maxProximity > 0
      ) {
        const elevatorParams: ElevatorCalculationParams = {
          proximityDistance,
          minProximity: proximity.minProximity,
          maxProximity: proximity.maxProximity,
          maxHeight: ELEVATOR_MAX_HEIGHT,
        }
        const initialPosition = calculateElevatorPosition(elevatorParams)

        // Set initial positions without animation
        // Note: Divide by 34 to match actual elevator travel (empirically determined, same as ElevatorIndicators)
        const elevatorScale = 34
        animationState.current.elevatorY = initialPosition
        animationState.current.containerZ = -initialPosition
        animationState.current.smoothedElevatorTarget = initialPosition // CRITICAL: Initialize smoothed target!
        elevatorRef.current.position.y = initialPosition / elevatorScale
        containerRef.current.position.z = -initialPosition / elevatorScale

        positionInitializedRef.current = true
      }
    }
  }, [elevatorRef, containerRef, proximityDistance, proximity.minProximity, proximity.maxProximity])

  useFrame((state, delta) => {
    // Don't animate until refs are ready
    if (!refsReadyRef.current) return

    const { state: currentState, hardware } = systemStatus

    // Create check params for animation decisions
    const checkParams: AnimationCheckParams = {
      systemStatus,
      testMode,
      currentState,
    }

    // Calculate elevator position
    const getElevatorTarget = (): number => {
      // Debug proximity settings
      const debugInterval = 2000
      if (
        !animationState.current.lastSettingsLog ||
        Date.now() - animationState.current.lastSettingsLog > debugInterval
      ) {
        console.log(
          '[ELEVATOR] Settings - minProx:',
          proximity.minProximity,
          'maxProx:',
          proximity.maxProximity,
          'currentProx:',
          proximityDistance
        )
        animationState.current.lastSettingsLog = Date.now()
      }

      // Only calculate if we have valid proximity data
      if (proximityDistance > 0 && proximity.minProximity > 0 && proximity.maxProximity > 0) {
        const elevatorParams: ElevatorCalculationParams = {
          proximityDistance,
          minProximity: proximity.minProximity,
          maxProximity: proximity.maxProximity,
          maxHeight: ELEVATOR_MAX_HEIGHT,
        }

        const target = calculateElevatorPosition(elevatorParams)
        return target
      }
      // Return current position if no valid data
      console.log(
        '[ELEVATOR] Invalid proximity data, returning current position:',
        animationState.current.elevatorY
      )
      return animationState.current.elevatorY
    }

    // Animate container (moves opposite to elevator)
    if (containerRef.current) {
      const shouldPulse = shouldAnimateElevator(checkParams)

      // Apply pulse effect for state changes
      applyPulseToChildren(containerRef.current, shouldPulse, state.clock.elapsedTime)

      // Use the smoothed target from elevator calculation
      const targetZ = -animationState.current.smoothedElevatorTarget
      const lerpParams: LerpParams = {
        current: animationState.current.containerZ,
        target: targetZ,
        delta,
        speed: 2.5, // Match elevator speed for synchronized movement
      }
      animationState.current.containerZ = smoothLerp(lerpParams)
      // Divide by 34 to match actual elevator travel (empirically determined, same as ElevatorIndicators)
      const elevatorScale = 34
      containerRef.current.position.z = animationState.current.containerZ / elevatorScale
    }

    // Animate elevator
    if (elevatorRef.current) {
      const shouldPulse = shouldAnimateElevator(checkParams)
      const pulseParams: PulseEffectParams = {
        object: elevatorRef.current,
        shouldPulse,
        elapsedTime: state.clock.elapsedTime,
      }
      applyPulseEffect(pulseParams)

      // SMOOTH TARGET FIRST to prevent jumps from discrete sensor readings
      const rawTarget = getElevatorTarget()
      const targetSmoothParams: LerpParams = {
        current: animationState.current.smoothedElevatorTarget,
        target: rawTarget,
        delta,
        speed: 2.0, // Fast smoothing of target
      }
      animationState.current.smoothedElevatorTarget = smoothLerp(targetSmoothParams)

      // Then smooth elevator movement to the smoothed target
      const lerpParams: LerpParams = {
        current: animationState.current.elevatorY,
        target: animationState.current.smoothedElevatorTarget,
        delta,
        speed: 2.5, // Slower, smoother interpolation for visible movement
      }
      animationState.current.elevatorY = smoothLerp(lerpParams)

      // Debug logging (remove after testing)
      const debugInterval = 2000 // ms
      if (
        !animationState.current.lastDebugLog ||
        Date.now() - animationState.current.lastDebugLog > debugInterval
      ) {
        console.log(
          '[ELEVATOR] rawTarget:',
          rawTarget.toFixed(2),
          'smoothed:',
          animationState.current.smoothedElevatorTarget.toFixed(2),
          'elevatorY:',
          animationState.current.elevatorY.toFixed(2),
          'prox:',
          proximityDistance
        )
        animationState.current.lastDebugLog = Date.now()
      }

      // Divide by 34 to match actual elevator travel (empirically determined, same as ElevatorIndicators)
      const elevatorScale = 34
      elevatorRef.current.position.y = animationState.current.elevatorY / elevatorScale
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
          animationState.current.wheelRotation += delta * motorSpeed
          animationState.current.lastDosingState = DosingStatus.FWD
        } else if (dosingStatus === DosingStatus.BWD) {
          // Continuous backward rotation
          const motorSpeed = dosingSettings.motorSpeed || 1.0
          animationState.current.wheelRotation -= delta * motorSpeed
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
              delta,
              speed: 2.0, // Faster for single pill
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
            delta,
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
        animationState.current.grinderKnifeRotation += delta * GRINDER_KNIFE_SPEED
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
