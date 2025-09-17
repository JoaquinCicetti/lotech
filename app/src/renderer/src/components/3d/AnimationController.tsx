import { useFrame } from '@react-three/fiber'
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
    lastDosingState: 'IDLE',
    elevatorTarget: 0,
    lastProximityDistance: 0,
    isDosingMotorMoving: false,
    dosingStepCount: 0,
  })

  const testMode = useAppStore((state) => state.testMode)
  const currentDosing = useAppStore((state) => state.currentDosing)
  const proximityDistance = useControllerStateStore(
    (state) => state.sensorReadings.proximityDistance
  )
  const proximity = useSettingsStore((state) => state.proximity)

  // Set initial elevator position on mount
  React.useEffect(() => {
    if (elevatorRef.current && containerRef.current) {
      const elevatorParams: ElevatorCalculationParams = {
        proximityDistance,
        minProximity: proximity.minProximity,
        maxProximity: proximity.maxProximity,
        maxHeight: ELEVATOR_MAX_HEIGHT,
      }
      const initialPosition = calculateElevatorPosition(elevatorParams)

      // Set initial positions without animation
      animationState.current.elevatorY = initialPosition
      animationState.current.containerZ = -initialPosition
      elevatorRef.current.position.y = initialPosition
      containerRef.current.position.z = -initialPosition
    }
  }, []) // Run only on mount

  useFrame((state, delta) => {
    const { state: currentState, hardware } = systemStatus

    // Create check params for animation decisions
    const checkParams: AnimationCheckParams = {
      systemStatus,
      testMode,
      currentState,
    }

    // Calculate elevator position
    const getElevatorTarget = (): number => {
      const elevatorParams: ElevatorCalculationParams = {
        proximityDistance,
        minProximity: proximity.minProximity,
        maxProximity: proximity.maxProximity,
        maxHeight: ELEVATOR_MAX_HEIGHT,
      }
      return calculateElevatorPosition(elevatorParams)
    }

    // Animate container (moves opposite to elevator)
    if (containerRef.current) {
      const shouldPulse = shouldAnimateElevator(checkParams)

      // Apply pulse effect for state changes
      applyPulseToChildren(containerRef.current, shouldPulse, state.clock.elapsedTime)

      // Smooth container movement
      const targetZ = -getElevatorTarget()
      const lerpParams: LerpParams = {
        current: animationState.current.containerZ,
        target: targetZ,
        delta,
        speed: 3.5,
      }
      animationState.current.containerZ = smoothLerp(lerpParams)
      containerRef.current.position.z = animationState.current.containerZ
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

      // Smooth elevator movement
      const targetY = getElevatorTarget()
      const lerpParams: LerpParams = {
        current: animationState.current.elevatorY,
        target: targetY,
        delta,
        speed: 3.5,
      }
      animationState.current.elevatorY = smoothLerp(lerpParams)
      elevatorRef.current.position.y = animationState.current.elevatorY
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

      // In manual/test mode with hardware status
      if (testMode && hardware) {
        // Check if dosing motor is moving (manual control)
        const isMotorMoving = hardware.dosing === 'ACTIVE'

        if (isMotorMoving) {
          // Continuous rotation while motor is active in manual mode
          animationState.current.wheelRotation += delta * 2
          animationState.current.isDosingMotorMoving = true
        } else if (animationState.current.isDosingMotorMoving) {
          // Motor just stopped
          animationState.current.isDosingMotorMoving = false
        }
      } else if (currentState === MachineState.DOSIFICACION) {
        // In automatic dosing state, rotate one step per pill
        const degreesPerDivision = 360 / currentDosing.wheelDivisions
        const radiansPerDivision = (degreesPerDivision * Math.PI) / 180

        // Check if we need to advance to next pill position
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
