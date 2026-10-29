/**
 * Design tokens. Every colour, spacing step and radius in the app comes from here,
 * so the look can be retuned in one place.
 */

export const colors = {
  bg: '#0B0B0D',
  surface: '#151518',
  surfaceRaised: '#1E1E23',
  border: '#2A2A31',
  /** For controls that must stand out against a surface, e.g. an "off" switch track. */
  borderStrong: '#45454F',

  text: '#F5F5F7',
  textMuted: '#A1A1AA',
  textFaint: '#6E6E78',

  accent: '#FF6B1A',
  accentPressed: '#E25A0E',
  accentMuted: 'rgba(255, 107, 26, 0.14)',
  // Dark text on orange: white on this orange fails contrast (about 2.8:1), near-black passes (about 7:1).
  onAccent: '#0B0B0D',

  success: '#34D399',
  danger: '#FF453A',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Minimum touch target. Larger than the 44pt platform minimum because it is used mid-workout. */
export const minTouchTarget = 48;

export type ColorToken = keyof typeof colors;
