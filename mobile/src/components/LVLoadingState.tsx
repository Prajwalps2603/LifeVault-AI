import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface LVLoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LVLoadingState: React.FC<LVLoadingStateProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.base,
  },
  message: {
    ...typography.styles.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
