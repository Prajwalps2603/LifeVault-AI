import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { colors, typography, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Tagline animation
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Navigate after 2.8 seconds
    const timer = setTimeout(onFinish, 2800);
    return () => clearTimeout(timer);
  }, [logoOpacity, logoScale, onFinish, taglineOpacity, taglineY]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Background circle decorations */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
        {/* Vault icon */}
        <View style={styles.iconBg}>
          <View style={styles.vaultRingOuter} />
          <View style={styles.vaultRingInner} />
          <View style={styles.vaultDot} />
        </View>

        <Text style={styles.appName}>
          Life<Text style={styles.appNameAccent}>Vault</Text>
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.taglineContainer,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          },
        ]}>
        <Text style={styles.tagline}>Your life. Organized.</Text>
      </Animated.View>
    </View>
  );
};

const CIRCLE_SIZE = width * 1.2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleTopRight: {
    position: 'absolute',
    top: -CIRCLE_SIZE * 0.45,
    right: -CIRCLE_SIZE * 0.45,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -CIRCLE_SIZE * 0.5,
    left: -CIRCLE_SIZE * 0.5,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoContainer: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  vaultRingOuter: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'transparent',
  },
  vaultRingInner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  vaultDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: -1,
  },
  appNameAccent: {
    color: colors.white,
    fontWeight: '800',
  },
  taglineContainer: {
    position: 'absolute',
    bottom: height * 0.15,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
