/**
 * LifeVault Design System — Spacing
 */
export const spacing = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16,
  9: 18,
  10: 20,
  12: 24,
  14: 28,
  16: 32,
  20: 40,
  24: 48,
  32: 64,

  // Semantic
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,

  // Screen padding
  screenPadding: 20,
  screenPaddingLarge: 24,

  // Card
  cardPadding: 16,
  cardPaddingLarge: 20,

  // Section
  sectionGap: 24,
  itemGap: 12,
};

export type Spacing = typeof spacing;

/**
 * LifeVault Design System — Border Radii
 */
export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,

  // Semantic
  card: 16,
  cardLarge: 20,
  button: 12,
  buttonRound: 9999,
  chip: 8,
  badge: 9999,
  input: 12,
  modal: 24,
  icon: 10,
};

export type Radii = typeof radii;
