/**
 * LifeVault Design System — Central Export
 */

export { colors } from './colors';
export type { Colors } from './colors';

export { typography } from './typography';
export type { Typography } from './typography';

export { spacing, radii } from './spacing';
export type { Spacing, Radii } from './spacing';

export { shadows } from './shadows';
export type { Shadows } from './shadows';

import { colors } from './colors';
import { typography } from './typography';
import { spacing, radii } from './spacing';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
};

export type Theme = typeof theme;
