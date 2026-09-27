/**
 * LVErrorBoundary — Production crash boundary and recovery component.
 *
 * Implements Section 84 (Phase 9):
 * - Catches JavaScript runtime exceptions gracefully
 * - Prevents abrupt application crashes
 * - Provides immediate recovery button with state reset
 * - Assures users that their offline data & cloud files remain secure
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, shadows } from '../theme';
import { AnimatedIcon } from './AnimatedIcon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LVErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[LVErrorBoundary] Caught unhandled exception:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <AnimatedIcon name="shield" size={36} color={colors.primary} active />
            </View>
            <Text style={styles.title}>LifeVault Recovery</Text>
            <Text style={styles.subtitle}>
              An unexpected display issue occurred, but your vault is safe.
            </Text>
            <View style={styles.assuranceBox}>
              <Text style={styles.assuranceText}>
                All documents and data remain securely stored on your device and in your Google account.
              </Text>
            </View>
            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorLabel}>Technical Details:</Text>
                <Text style={styles.errorText} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={this.handleRestart}
              activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>Reload LifeVault</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  assuranceBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radii.card,
    padding: spacing.md,
    width: '100%',
  },
  assuranceText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    padding: spacing.sm,
    width: '100%',
    gap: 2,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  errorText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
