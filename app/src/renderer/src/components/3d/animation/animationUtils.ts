import * as THREE from 'three'
import { ElevatorStatus } from '../../../serial/commands'
import { MachineState } from '../../../types'
import { ANIMATION_COLORS, DEFAULT_ANIMATION_CONFIG } from './constants'
import {
  AnimationCheckParams,
  AnimationConfig,
  ElevatorCalculationParams,
  LerpParams,
  PulseEffectParams,
  WheelRotationParams,
  WheelRotationResult,
} from './types'

const materialCache = new WeakMap<THREE.Object3D, THREE.MeshStandardMaterial>()

export function applyPulseEffect(params: PulseEffectParams): void {
  const { object, shouldPulse, elapsedTime, config } = params

  if (!('material' in object)) return

  // Use cached material instead of cloning every frame
  let material = materialCache.get(object)
  if (!material) {
    const originalMaterial = object.material as THREE.MeshStandardMaterial
    material = originalMaterial.clone()
    materialCache.set(object, material)
    object.material = material
  }

  const finalConfig: AnimationConfig = {
    ...DEFAULT_ANIMATION_CONFIG,
    ...config,
  }

  if (shouldPulse) {
    const pulseFactor = (Math.sin(elapsedTime * finalConfig.pulseSpeed) + 1) / 2
    material.color.lerpColors(ANIMATION_COLORS.base, ANIMATION_COLORS.pulse, pulseFactor)
  } else {
    material.color.set(ANIMATION_COLORS.base)
  }
}

export function applyPulseToChildren(
  parent: THREE.Object3D,
  shouldPulse: boolean,
  elapsedTime: number,
  config?: Partial<AnimationConfig>
): void {
  parent.children.forEach((child) => {
    const params: PulseEffectParams = {
      object: child,
      shouldPulse,
      elapsedTime,
      config,
    }
    applyPulseEffect(params)
  })
}

export function smoothLerp(params: LerpParams): number {
  const { current, target, delta, speed = DEFAULT_ANIMATION_CONFIG.lerpSpeed } = params
  return THREE.MathUtils.lerp(current, target, delta * speed)
}

export function calculateElevatorPosition(params: ElevatorCalculationParams): number {
  const { proximityDistance, minProximity, maxProximity, maxHeight } = params

  // sensing from top so topPosition < bottomPosition
  const topPosition = maxProximity
  const bottomPosition = minProximity

  console.log({ proximityDistance, minProximity, maxProximity, maxHeight })

  if (proximityDistance <= topPosition) {
    return maxHeight
  } else if (proximityDistance >= minProximity) {
    return 0
  } else {
    const ratio = 1 - (proximityDistance - topPosition) / (bottomPosition - topPosition)

    console.log({ ratio })
    return ratio * maxHeight
  }
}

export function shouldAnimateElevator(params: AnimationCheckParams): boolean {
  const { systemStatus, testMode, currentState } = params

  if (testMode && systemStatus.hardware) {
    const { elevator } = systemStatus.hardware
    return elevator === ElevatorStatus.MOVING_UP || elevator === ElevatorStatus.MOVING_DOWN
  }
  return currentState === MachineState.ASCENSOR || currentState === MachineState.DESCARGA
}

export function shouldAnimateDosing(params: AnimationCheckParams): boolean {
  const { systemStatus, currentState } = params

  if (systemStatus.hardware) {
    return systemStatus.hardware.dosing === 'ACTIVE'
  }
  return currentState === MachineState.DOSIFICACION
}

export function shouldAnimateGrinder(params: AnimationCheckParams): boolean {
  const { systemStatus, currentState } = params

  if (systemStatus.hardware) {
    return systemStatus.hardware.grinder === 'ON'
  }
  return currentState === MachineState.MOLIENDA
}

export function shouldAnimateCapper(params: AnimationCheckParams): boolean {
  const { systemStatus, currentState } = params

  if (systemStatus.hardware) {
    return systemStatus.hardware.cap === 'PUSHED'
  }
  return currentState === MachineState.CIERRE
}

export function shouldAnimateTransfer(params: AnimationCheckParams): boolean {
  const { systemStatus, currentState } = params

  if (systemStatus.hardware) {
    return systemStatus.hardware.transfer === 'OPEN'
  }
  return currentState === MachineState.TRASPASO
}

export function shouldAnimateLoadCell(currentState: MachineState): boolean {
  return currentState === MachineState.PESAJE
}

export function calculateWheelRotation(params: WheelRotationParams): WheelRotationResult {
  const { currentRotation, targetRotation, wheelDivisions, isActive, wasActive } = params

  let newTarget = targetRotation

  if (isActive && !wasActive) {
    const degreesPerDivision = 360 / wheelDivisions
    const radiansPerDivision = (degreesPerDivision * Math.PI) / 180
    newTarget = currentRotation + radiansPerDivision
  }

  return {
    newRotation: currentRotation,
    newTarget,
  }
}
