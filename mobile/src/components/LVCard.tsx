import React from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, shadows, radii, spacing } from '../theme';

interface LVCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  elevated?: boolean;
  noPadding?: boolean;
}

export const LVCard: React.FC<LVCardProps> = ({
  children,
  style,
  onPress,
  elevated = true,
  noPadding = false,
}) => {
  const content = (
    <View
      style={[
        styles.card,
        elevated && shadows.card,
        noPadding && styles.noPadding,
        style,
      ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  noPadding: {
    padding: 0,
  },
});
