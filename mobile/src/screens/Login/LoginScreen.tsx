import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { colors, spacing, typography, radii, shadows } from '../../theme';
import { AnimatedIcon, type IconType } from '../../components/AnimatedIcon';
import { useAppStore } from '../../store/AppContext';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: () => void;
}

const FEATURES: Array<{ icon: IconType; text: string }> = [
  { icon: 'folder', text: 'Your Drive — your files, always' },
  { icon: 'document', text: 'Your data — organized automatically' },
  { icon: 'reminder', text: 'Smart reminders before things expire' },
  { icon: 'sparkle', text: 'AI-powered organization and search' },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [connecting, setConnecting] = React.useState(false);
  const { signInWithGoogle } = useAppStore();

  const handleGoogleLogin = async () => {
    try {
      setConnecting(true);
      await signInWithGoogle();
      onLogin();
    } catch (err: any) {
      Alert.alert('Sign In Error', err?.message || 'Failed to authenticate with Google.');
    } finally {
      setConnecting(false);
    }
  };

  const handleOfflineLogin = () => {
    onLogin();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Top gradient accent */}
      <View style={styles.accentTop} />
      <View style={styles.accentCircle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <View style={styles.vaultRing} />
            <View style={styles.vaultDot} />
          </View>
          <Text style={styles.logoName}>
            Life<Text style={styles.logoNameAccent}>Vault</Text>
          </Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Your life.{'\n'}Organized.</Text>
          <Text style={styles.heroSubtitle}>
            You enter it once.{'\n'}LifeVault remembers it for you.
          </Text>
        </View>

        {/* Feature List */}
        <View style={styles.features}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <AnimatedIcon name={feature.icon} size={18} active color={colors.primary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={connecting}
            activeOpacity={0.9}>
            <View style={styles.googleLogo}>
              <Text style={styles.googleLogoText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>
              {connecting ? 'Connecting Google Account...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' }}
            onPress={handleOfflineLogin}
            activeOpacity={0.7}>
            <Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '500' }}>
              Or use Local Vault (Offline Mode)
            </Text>
          </TouchableOpacity>

          <View style={styles.demoBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <AnimatedIcon name="lock" size={14} active color={colors.textSecondary} />
              <Text style={styles.demoBadgeText}>Data stored in your private Google Drive & Sheets</Text>
            </View>
            <Text style={[styles.demoBadgeText, { fontSize: 11, marginTop: 3, opacity: 0.85 }]}>
              OAuth 2.0: Google Identity Services (Drive & Sheets Scope)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms</Text> and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
          <Text style={styles.footerNote}>
            Your data lives in your Google Drive.{'\n'}LifeVault never stores your files on our servers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  accentTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  accentCircle: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.primaryMid,
    opacity: 0.35,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 60,
    paddingBottom: 40,
    gap: spacing.sectionGap,
  },

  // Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultRing: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
  },
  vaultDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
  },
  logoName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  logoNameAccent: {
    color: colors.primary,
    fontWeight: '800',
  },

  // Hero
  heroSection: {
    marginTop: spacing.xl,
    gap: spacing.base,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  heroSubtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    lineHeight: 26,
    fontWeight: '400',
  },

  // Features
  features: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.cardLarge,
    padding: spacing.base,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },

  // CTA
  ctaSection: {
    gap: spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadows.md,
  },
  googleLogo: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  demoBadge: {
    backgroundColor: colors.warningLight,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  demoBadgeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Footer
  footer: {
    gap: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
