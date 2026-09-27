import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

interface LVLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  light?: boolean;
  style?: ViewStyle;
}

const logoSizes = {
  sm: { icon: 28, iconText: 14, name: 16, tagline: 11 },
  md: { icon: 40, iconText: 20, name: 22, tagline: 13 },
  lg: { icon: 56, iconText: 28, name: 28, tagline: 15 },
  xl: { icon: 80, iconText: 40, name: 36, tagline: 17 },
};

export const LVLogo: React.FC<LVLogoProps> = ({
  size = 'md',
  showTagline = false,
  light = false,
  style,
}) => {
  const dim = logoSizes[size];
  const textColor = light ? colors.white : colors.textPrimary;
  const subColor = light ? 'rgba(255,255,255,0.8)' : colors.textSecondary;

  return (
    <View style={[styles.container, style]}>
      {/* Logomark: shield/vault icon using pure React Native */}
      <View
        style={[
          styles.iconContainer,
          {
            width: dim.icon,
            height: dim.icon,
            borderRadius: dim.icon * 0.28,
          },
        ]}>
        {/* Inner vault symbol */}
        <View style={[styles.vaultRing, {
          width: dim.icon * 0.55,
          height: dim.icon * 0.55,
          borderRadius: dim.icon * 0.275,
          borderWidth: dim.icon * 0.07,
        }]} />
        <View style={[styles.vaultDot, {
          width: dim.icon * 0.18,
          height: dim.icon * 0.18,
          borderRadius: dim.icon * 0.09,
          top: '50%',
          left: '50%',
          marginTop: -(dim.icon * 0.09),
          marginLeft: -(dim.icon * 0.09),
        }]} />
      </View>

      <View style={styles.textBlock}>
        <Text
          style={[
            styles.name,
            { fontSize: dim.name, color: textColor },
          ]}>
          Life<Text style={[styles.nameAccent, { fontSize: dim.name }]}>Vault</Text>
        </Text>
        {showTagline && (
          <Text style={[styles.tagline, { fontSize: dim.tagline, color: subColor }]}>
            Your life. Organized.
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vaultRing: {
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  vaultDot: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
  },
  textBlock: {
    gap: 2,
  },
  name: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nameAccent: {
    color: colors.primary,
    fontWeight: '800',
  },
  tagline: {
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
