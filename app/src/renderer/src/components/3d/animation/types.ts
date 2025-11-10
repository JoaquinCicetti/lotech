import { DosingStatus } from '@renderer/serial'
import * as THREE from 'three'
import { MachineState, SystemStatus } from '../../../types'

export interface AnimationConfig {
  pulseSpeed: number
  lerpSpeed: number
  rotationSpeed: number
}

export interface AnimationColors {
  base: THREE.Color
  pulse: THREE.Color
}

export interface ElevatorCalculationParams {
  proximityDistance: number
  minProximity: number
  maxProximity: number
  maxHeight: number
}

export interface WheelRotationParams {
  currentRotation: number
  targetRotation: number
  wheelDivisions: number
  isActive: boolean
  wasActive: boolean
}

export interface WheelRotationResult {
  newRotation: number
  newTarget: number
}

export interface AnimationCheckParams {
  systemStatus: SystemStatus
  testMode: boolean
  currentState: MachineState
}

export interface PulseEffectParams {
  object: THREE.Object3D
  shouldPulse: boolean
  elapsedTime: number
  config?: Partial<AnimationConfig>
}

export interface LerpParams {
  current: number
  target: number
  delta: number
  speed?: number
}

export interface AnimationState {
  containerZ: number
  elevatorY: number
  wheelRotation: number
  wheelTargetRotation: number
  grinderRotation: number
  grinderKnifeRotation: number
  capperPosition: number
  solenoidScale: number
  lastDosingState: DosingStatus
  elevatorTarget: number
  lastProximityDistance: number
  isDosingMotorMoving: boolean
  dosingStepCount: number
  smoothedElevatorTarget: number // Smoothed target to prevent jumps from discrete sensor readings
  lastDebugLog?: number // For debug logging throttling
  lastSettingsLog?: number // For settings debug logging throttling
}

export interface AnimationRefs {
  elevatorRef: React.RefObject<THREE.Object3D | null>
  containerRef: React.RefObject<THREE.Object3D | null>
  wheelRef: React.RefObject<THREE.Object3D | null>
  grinderRef: React.RefObject<THREE.Object3D | null>
  grinderKnifeRef: React.RefObject<THREE.Object3D | null>
  capperRef: React.RefObject<THREE.Object3D | null>
  solenoidRef: React.RefObject<THREE.Object3D | null>
  loadCellRef: React.RefObject<THREE.Object3D | null>
  elevatorIndicatorRef?: React.RefObject<THREE.Mesh | null>
  elevatorLightRef?: React.RefObject<THREE.PointLight | null>
}
