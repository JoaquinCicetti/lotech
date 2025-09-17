import * as THREE from 'three'
import { AnimationColors, AnimationConfig } from './types'

export const ANIMATION_COLORS: AnimationColors = {
  base: new THREE.Color(0xfafafa),
  pulse: new THREE.Color(0x344496),
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  pulseSpeed: 5,
  lerpSpeed: 0.6,
  rotationSpeed: 0.1,
}

export const ELEVATOR_MAX_HEIGHT = 70
export const GRINDER_KNIFE_SPEED = 50
export const WHEEL_ROTATION_SPEED = 3
