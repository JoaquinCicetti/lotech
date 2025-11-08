/**
 * Centralized theme configuration for the Lotech application
 * Maintains consistent brand colors across UI and 3D components
 */

// Brand colors (from CSS variables)
export const BRAND_COLORS = {
  // Primary brand color - Blue
  primary: {
    hsl: 'hsl(204, 90%, 37%)',
    hex: '#0b68b2',
    rgb: { r: 11, g: 104, b: 178 },
  },
  // Accent color - Lighter Blue
  accent: {
    hsl: 'hsl(204, 90%, 50%)',
    hex: '#0d7fd9',
    rgb: { r: 13, g: 127, b: 217 },
  },
  // Success/Active color - Bright Blue
  success: {
    hsl: 'hsl(204, 100%, 60%)',
    hex: '#3399ff',
    rgb: { r: 51, g: 153, b: 255 },
  },
  // Warning color - Brand Blue (lighter)
  warning: {
    hsl: 'hsl(204, 90%, 50%)',
    hex: '#0d7fd9',
    rgb: { r: 13, g: 127, b: 217 },
  },
  // Danger/Error color - Red
  danger: {
    hsl: 'hsl(0, 72%, 51%)',
    hex: '#dc2626',
    rgb: { r: 220, g: 38, b: 38 },
  },
}

// 3D Scene colors
export const SCENE_COLORS = {
  // Environment
  background: {
    gradient: {
      from: '#0a1929', // deep blue-gray
      via: '#0d2744', // blue-gray
      to: '#0a1929', // deep blue-gray
    },
    fog: '#0d2744', // blue-gray
  },
  ground: {
    base: '#1e3a5f', // dark blue
    grid: {
      cell: '#2d4f7a', // medium blue
      section: '#4a6fa5', // lighter blue
    },
  },

  // Lighting
  lighting: {
    ambient: '#e3f2fd', // light blue
    key: '#bbdefb', // soft blue
    fill: '#e1f5fe', // cyan-blue
    rim: '#90caf9', // bright blue
  },

  // Model materials
  model: {
    base: '#fafafa',
    pulse: BRAND_COLORS.primary.hex,
  },

  // Indicators
  indicators: {
    active: '#84cc16', // lime-500 (green)
    inactive: '#4d7c0f', // lime-700 (dark green)
    position: BRAND_COLORS.warning.hex, // brand blue
    path: '#4a6fa5', // medium blue
  },
}

// Convert hex to THREE.js compatible number
export const hexToThreeColor = (hex: string): number => {
  return parseInt(hex.replace('#', '0x'), 16)
}

// Export pre-converted colors for THREE.js
export const THREE_COLORS = {
  primary: hexToThreeColor(BRAND_COLORS.primary.hex),
  accent: hexToThreeColor(BRAND_COLORS.accent.hex),
  success: hexToThreeColor(BRAND_COLORS.success.hex),
  warning: hexToThreeColor(BRAND_COLORS.warning.hex),
  danger: hexToThreeColor(BRAND_COLORS.danger.hex),

  model: {
    base: hexToThreeColor(SCENE_COLORS.model.base),
    pulse: hexToThreeColor(SCENE_COLORS.model.pulse),
  },

  indicators: {
    active: hexToThreeColor(SCENE_COLORS.indicators.active),
    inactive: hexToThreeColor(SCENE_COLORS.indicators.inactive),
    position: hexToThreeColor(SCENE_COLORS.indicators.position),
    path: hexToThreeColor(SCENE_COLORS.indicators.path),
  },
}
