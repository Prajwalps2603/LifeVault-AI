/**
 * LifeVault Design System — Colors
 * Premium white/light theme with carefully curated palette.
 */

export const colors = {
  // Backgrounds
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Primary — Deep Blue
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryMid: '#BFDBFE',
  primaryDark: '#1D4ED8',

  // Secondary — Violet
  secondary: '#7C3AED',
  secondaryLight: '#F5F3FF',
  secondaryMid: '#DDD6FE',

  // Semantic
  success: '#16A34A',
  successLight: '#F0FDF4',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#0EA5E9',
  infoLight: '#F0F9FF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textDisabled: '#CBD5E1',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F1F5F9',
  borderFocus: '#2563EB',

  // UI elements
  cardShadow: 'rgba(15, 23, 42, 0.06)',
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.15)',

  // Category colors
  categoryDocuments: '#2563EB',
  categoryReceipts: '#16A34A',
  categoryPayments: '#F59E0B',
  categoryVehicles: '#7C3AED',
  categoryAssets: '#0EA5E9',
  categoryInsurance: '#DC2626',
  categoryWarranty: '#F97316',
  categoryOther: '#64748B',

  // Status
  statusDue: '#DC2626',
  statusUpcoming: '#F59E0B',
  statusPaid: '#16A34A',
  statusOverdue: '#991B1B',
  statusPending: '#6B7280',

  // Gradients (start/end pairs)
  gradientPrimary: ['#2563EB', '#7C3AED'] as [string, string],
  gradientSuccess: ['#16A34A', '#0EA5E9'] as [string, string],
  gradientWarm: ['#F59E0B', '#F97316'] as [string, string],

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export type Colors = typeof colors;
