import {
  DelaySettings,
  DosingSettings,
  ElevatorSettings,
  HardwareTimeouts,
  ProximitySettings,
  ViewMode,
  ViewSettings,
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
  motorSpeed: 2.0,  // Default 2 radians per second
}

export const DEFAULT_PROXIMITY: ProximitySettings = {
  minProximity: 100,  // VL53L0X: distance at TOP position (mm)
  maxProximity: 300,  // VL53L0X: distance at BOTTOM position (mm)
}

export const DEFAULT_ELEVATOR: ElevatorSettings = {
  speed: 800,     // Default speed (steps per second)
  minSpeed: 100,  // Minimum speed (steps per second)
  maxSpeed: 2000, // Maximum speed (steps per second)
}

export const DEFAULT_TIMEOUTS: HardwareTimeouts = {
  transferMax: 10000,  // 10 seconds maximum
  capMax: 10000,       // 10 seconds maximum
  grinderMax: 30000,   // 30 seconds maximum
}

export const DEFAULT_VIEW: ViewSettings = {
  viewMode: ViewMode.STANDARD,
}
