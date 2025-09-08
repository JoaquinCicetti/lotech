import { DelaySettings, DosingSettings, ViewMode, ViewSettings } from '@renderer/types'

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
}

export const DEFAULT_VIEW: ViewSettings = {
  viewMode: ViewMode.STANDARD,
}
