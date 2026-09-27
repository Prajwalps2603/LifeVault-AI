import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';
import { getInitials } from '../utils/helpers';

interface LVAvatarProps {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const sizes = {
  sm: { container: 32, text: 12 },
  md: { container: 44, text: 16 },
  lg: { container: 56, text: 20 },
  xl: { container: 80, text: 28 },
};

export const LVAvatar: React.FC<LVAvatarProps> = ({
  name,
  size = 'md',
  style,
}) => {
  const dim = sizes[size];
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: dim.container,
          height: dim.container,
          borderRadius: dim.container / 2,
        },
        style,
      ]}>
      <Text style={[styles.initials, { fontSize: dim.text }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primaryMid,
  },
  initials: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
});
