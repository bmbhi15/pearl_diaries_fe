export const COLORS = {
  bg: '#0B1120',
  surface: '#151E32',
  surfaceLight: '#1E2A44',
  border: 'rgba(255,255,255,0.08)',
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  secondary: '#EC4899',
  accent: '#F59E0B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
} as const;

export const GRADIENTS = {
  brand: ['#7C3AED', '#EC4899'] as const,
  pearl: ['#F5F3FF', '#C4B5FD', '#7C3AED'] as const,
  overlay: ['transparent', 'rgba(0,0,0,0.85)'] as const,
} as const;

/** Marquee events of Pearl — BITS Pilani Hyderabad's cultural festival. */
export const PEARL_EVENTS = [
  'Pro Show Night',
  'Battle of Bands',
  'Street Dance Battle',
  'Mr & Ms Pearl',
  'EDM Night',
  'Comedy Night',
  'Open Mic',
  'Qawwali Night',
  'Treasure Hunt',
  'Art Exhibition',
] as const;
