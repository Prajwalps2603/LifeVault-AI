import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface LVBadgeProps {
  label: string;
  variant?: BadgeVariant;
  small?: boolean;
  style?: ViewStyle;
}

export const LVBadge: React.FC<LVBadgeProps> = ({
  label,
  variant = 'primary',
  small = false,
  style,
}) => {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`], small && styles.small, style]}>
      <Text style={[styles.text, styles[`text_${variant}`], small && styles.smallText]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing.sm,
    borderRadius: radii.badge,
    alignSelf: 'flex-start',
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: spacing[3],
  },

  // Backgrounds
  badge_primary: { backgroundColor: colors.primaryLight },
  badge_success: { backgroundColor: colors.successLight },
  badge_warning: { backgroundColor: colors.warningLight },
  badge_error: { backgroundColor: colors.errorLight },
  badge_info: { backgroundColor: colors.infoLight },
  badge_neutral: { backgroundColor: colors.borderLight },

  // Text colors
  text: {
    ...typography.styles.captionBold,
  },
  text_primary: { color: colors.primary },
  text_success: { color: colors.success },
  text_warning: { color: '#B45309' },
  text_error: { color: colors.error },
  text_info: { color: colors.info },
  text_neutral: { color: colors.textSecondary },

  smallText: {
    fontSize: 10,
  },
});
