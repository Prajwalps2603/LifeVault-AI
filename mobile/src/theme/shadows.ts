/**
 * LifeVault Design System — Shadows
 */
import { Platform } from 'react-native';

const createShadow = (
  elevation: number,
  color: string = 'rgba(15, 23, 42, 0.08)',
) => {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: elevation * 0.8 },
      shadowOpacity: 1,
      shadowRadius: elevation * 1.5,
    },
    android: {
      elevation,
    },
    default: {},
  });
};

export const shadows = {
  none: {},
  xs: createShadow(1, 'rgba(15, 23, 42, 0.06)'),
  sm: createShadow(2, 'rgba(15, 23, 42, 0.07)'),
  md: createShadow(4, 'rgba(15, 23, 42, 0.08)'),
  lg: createShadow(8, 'rgba(15, 23, 42, 0.10)'),
  xl: createShadow(12, 'rgba(15, 23, 42, 0.12)'),
  '2xl': createShadow(20, 'rgba(15, 23, 42, 0.15)'),

  // Semantic
  card: createShadow(3, 'rgba(15, 23, 42, 0.07)'),
  button: createShadow(4, 'rgba(37, 99, 235, 0.25)'),
  modal: createShadow(16, 'rgba(15, 23, 42, 0.15)'),
  fab: createShadow(8, 'rgba(37, 99, 235, 0.30)'),
};

export type Shadows = typeof shadows;
