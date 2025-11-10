import {
  DelaySettings,
  DosingSettings,
  ElevatorSettings,
  HardwareTimeouts,
  LEDSettings,
  LoadCellSettings,
  ProximitySettings,
  WeightFilterSettings,
} from '@renderer/types'

export const DEFAULT_DELAYS: DelaySettings = {
  settle: 1500,
  weight: 2000,
  transfer: 1200,
  grind: 5000,
  cap: 2500,
  elevUp: 4000,
  elevDown: 4000,
}

export const DEFAULT_DOSING: DosingSettings = {
  wheelDivisions: 20,
  lotSize: 10,
  motorSpeed: 2.0, // Default 2 radians per second
}

export const DEFAULT_PROXIMITY: ProximitySettings = {
  minProximity: 100, // VL53L0X: distance at TOP position (mm)
  maxProximity: 300, // VL53L0X: distance at BOTTOM position (mm)
}

export const DEFAULT_ELEVATOR: ElevatorSettings = {
  speed: 800, // Default speed (steps per second)
  minSpeed: 100, // Minimum speed (steps per second)
  maxSpeed: 2000, // Maximum speed (steps per second)
}

export const DEFAULT_TIMEOUTS: HardwareTimeouts = {
  transferMax: 10000, // 10 seconds maximum
  capMax: 10000, // 10 seconds maximum
  grinderMax: 30000, // 30 seconds maximum
}

export const DEFAULT_LOADCELL: LoadCellSettings = {
  calibrationFactor: 2280.0, // Default HX711 calibration factor (adjust for your load cell)
  deadband: 0.05, // Ignore weight changes smaller than 0.05g (50mg)
}

export const DEFAULT_LED: LEDSettings = {
  brightness: 128, // Half brightness by default
  colors: Array.from({ length: 30 }, () => ({ r: 0, g: 0, b: 0 })), // All LEDs off by default
}

export const DEFAULT_WEIGHT_FILTER: WeightFilterSettings = {
  targetWeight: 1.0, // Expected 1g pill
  tolerance: 0.1, // ±0.1g variance
  zeroThreshold: 0.05, // Below 0.05g is considered zero
}
