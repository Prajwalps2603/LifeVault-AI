/**
 * AnimatedIcon — Premium animated vector-style icons replacing emojis across LifeVault AI.
 * Built with React Native Animated for silky 60fps micro-interactions.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme';

export type IconType =
  | 'today'
  | 'vault'
  | 'money'
  | 'profile'
  | 'document'
  | 'file'
  | 'receipt'
  | 'vehicle'
  | 'car'
  | 'asset'
  | 'reminder'
  | 'bell'
  | 'sparkle'
  | 'cloud'
  | 'lock'
  | 'search'
  | 'sync'
  | 'calendar'
  | 'shield'
  | 'fuel'
  | 'wrench'
  | 'cart'
  | 'lightning'
  | 'bill'
  | 'check'
  | 'folder'
  | 'export'
  | 'import'
  | 'sun'
  | 'info'
  | 'logout'
  | 'trash'
  | 'clock'
  | 'camera'
  | 'image';

interface AnimatedIconProps {
  name: IconType;
  size?: number;
  color?: string;
  active?: boolean;
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  name,
  size = 24,
  color,
  active = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const iconColor = color || (active ? colors.primary : colors.textTertiary);

  useEffect(() => {
    if (active) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.22,
          duration: 140,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => rotateAnim.setValue(0));
    }
  }, [active]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '12deg'],
  });

  const renderIconGraphic = () => {
    switch (name) {
      case 'today':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.42,
                borderRightWidth: size * 0.42,
                borderBottomWidth: size * 0.38,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: iconColor,
              }}
            />
            <View
              style={{
                width: size * 0.65,
                height: size * 0.45,
                backgroundColor: active ? iconColor : 'transparent',
                borderWidth: 2,
                borderColor: iconColor,
                borderTopWidth: 0,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}>
              <View
                style={{
                  width: size * 0.22,
                  height: size * 0.28,
                  backgroundColor: active ? colors.white : iconColor,
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              />
            </View>
          </View>
        );

      case 'vault':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.88,
                height: size * 0.88,
                borderRadius: size * 0.22,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}15` : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: size * 0.44,
                  height: size * 0.44,
                  borderRadius: (size * 0.44) / 2,
                  borderWidth: 2,
                  borderColor: iconColor,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <View
                  style={{
                    width: size * 0.16,
                    height: size * 0.16,
                    borderRadius: (size * 0.16) / 2,
                    backgroundColor: iconColor,
                  }}
                />
              </View>
              <View
                style={{
                  position: 'absolute',
                  right: -1,
                  width: 3,
                  height: size * 0.25,
                  backgroundColor: iconColor,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );

      case 'money':
      case 'bill':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                position: 'absolute',
                top: size * 0.08,
                left: size * 0.08,
                width: size * 0.72,
                height: size * 0.48,
                borderRadius: 4,
                borderWidth: 1.5,
                borderColor: `${iconColor}80`,
              }}
            />
            <View
              style={{
                width: size * 0.84,
                height: size * 0.58,
                borderRadius: 5,
                backgroundColor: active ? iconColor : 'transparent',
                borderWidth: 2,
                borderColor: iconColor,
                justifyContent: 'center',
                alignItems: 'flex-end',
                paddingRight: 4,
              }}>
              <View
                style={{
                  width: size * 0.18,
                  height: size * 0.18,
                  borderRadius: 3,
                  backgroundColor: active ? colors.white : iconColor,
                }}
              />
            </View>
          </View>
        );

      case 'profile':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.38,
                height: size * 0.38,
                borderRadius: (size * 0.38) / 2,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? iconColor : 'transparent',
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: size * 0.75,
                height: size * 0.35,
                borderTopLeftRadius: size * 0.35,
                borderTopRightRadius: size * 0.35,
                borderWidth: 2,
                borderBottomWidth: 0,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}30` : 'transparent',
              }}
            />
          </View>
        );

      case 'document':
      case 'file':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.68,
                height: size * 0.88,
                borderRadius: 3,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}15` : 'transparent',
                paddingTop: 4,
                paddingLeft: 3,
                gap: 2.5,
              }}>
              <View style={{ width: '65%', height: 2, backgroundColor: iconColor, borderRadius: 1 }} />
              <View style={{ width: '80%', height: 2, backgroundColor: iconColor, borderRadius: 1 }} />
              <View style={{ width: '50%', height: 2, backgroundColor: iconColor, borderRadius: 1 }} />
            </View>
          </View>
        );

      case 'receipt':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.72,
                height: size * 0.88,
                borderWidth: 2,
                borderColor: iconColor,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                backgroundColor: active ? `${iconColor}15` : 'transparent',
                alignItems: 'center',
                paddingTop: 4,
                gap: 3,
              }}>
              <View style={{ width: '60%', height: 2.5, backgroundColor: iconColor, borderRadius: 1 }} />
              <View style={{ width: '70%', height: 1.5, backgroundColor: `${iconColor}90` }} />
              <View style={{ width: '70%', height: 1.5, backgroundColor: `${iconColor}90` }} />
              <View style={{ width: '45%', height: 2, backgroundColor: iconColor, marginTop: 1 }} />
            </View>
          </View>
        );

      case 'vehicle':
      case 'car':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.5,
                height: size * 0.28,
                backgroundColor: active ? iconColor : 'transparent',
                borderWidth: 2,
                borderColor: iconColor,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                marginBottom: -2,
              }}
            />
            <View
              style={{
                width: size * 0.9,
                height: size * 0.32,
                backgroundColor: active ? iconColor : 'transparent',
                borderWidth: 2,
                borderColor: iconColor,
                borderRadius: 4,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingHorizontal: 3,
              }}>
              <View
                style={{
                  width: size * 0.16,
                  height: size * 0.16,
                  borderRadius: (size * 0.16) / 2,
                  backgroundColor: active ? colors.white : iconColor,
                  marginBottom: -3,
                }}
              />
              <View
                style={{
                  width: size * 0.16,
                  height: size * 0.16,
                  borderRadius: (size * 0.16) / 2,
                  backgroundColor: active ? colors.white : iconColor,
                  marginBottom: -3,
                }}
              />
            </View>
          </View>
        );

      case 'asset':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.6,
                height: size * 0.6,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}25` : 'transparent',
                transform: [{ rotate: '45deg' }],
                borderRadius: 3,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: size * 0.24,
                  height: size * 0.24,
                  backgroundColor: iconColor,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );

      case 'reminder':
      case 'bell':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.65,
                height: size * 0.55,
                borderTopLeftRadius: size * 0.35,
                borderTopRightRadius: size * 0.35,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? iconColor : 'transparent',
              }}
            />
            <View
              style={{
                width: size * 0.85,
                height: 2.5,
                backgroundColor: iconColor,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                width: size * 0.18,
                height: size * 0.14,
                backgroundColor: iconColor,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
              }}
            />
          </View>
        );

      case 'calendar':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.82,
                height: size * 0.85,
                borderRadius: 4,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}15` : 'transparent',
                overflow: 'hidden',
              }}>
              {/* Top Banner */}
              <View
                style={{
                  width: '100%',
                  height: size * 0.25,
                  backgroundColor: iconColor,
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  paddingHorizontal: 2,
                }}>
                <View style={{ width: 2.5, height: 4, backgroundColor: colors.white, borderRadius: 1 }} />
                <View style={{ width: 2.5, height: 4, backgroundColor: colors.white, borderRadius: 1 }} />
              </View>
              {/* Calendar Grid Dots */}
              <View
                style={{
                  flex: 1,
                  padding: 3,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignContent: 'space-around',
                }}>
                {[0, 1, 2, 3, 4, 5].map(dot => (
                  <View
                    key={dot}
                    style={{
                      width: size * 0.12,
                      height: size * 0.12,
                      borderRadius: 1,
                      backgroundColor: iconColor,
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        );

      case 'shield':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.75,
                height: size * 0.85,
                borderTopLeftRadius: size * 0.35,
                borderTopRightRadius: size * 0.35,
                borderBottomLeftRadius: size * 0.45,
                borderBottomRightRadius: size * 0.45,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}25` : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: size * 0.26,
                  height: size * 0.26,
                  borderRadius: (size * 0.26) / 2,
                  backgroundColor: iconColor,
                }}
              />
            </View>
          </View>
        );

      case 'fuel':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            {/* Pump Body */}
            <View
              style={{
                width: size * 0.52,
                height: size * 0.75,
                borderRadius: 3,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? iconColor : 'transparent',
                paddingTop: 3,
                alignItems: 'center',
              }}>
              {/* Meter display */}
              <View
                style={{
                  width: '65%',
                  height: size * 0.22,
                  borderRadius: 2,
                  borderWidth: 1,
                  borderColor: active ? colors.white : iconColor,
                }}
              />
            </View>
            {/* Nozzle hose */}
            <View
              style={{
                position: 'absolute',
                right: size * 0.08,
                top: size * 0.25,
                width: size * 0.28,
                height: size * 0.45,
                borderTopWidth: 2,
                borderRightWidth: 2,
                borderColor: iconColor,
                borderTopRightRadius: 4,
              }}
            />
          </View>
        );

      case 'wrench':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.75,
                height: size * 0.25,
                backgroundColor: iconColor,
                borderRadius: 2,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: size * 0.4,
                height: size * 0.4,
                borderRadius: (size * 0.4) / 2,
                borderWidth: 2.5,
                borderColor: iconColor,
                top: size * 0.1,
                left: size * 0.1,
              }}
            />
          </View>
        );

      case 'cart':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.65,
                height: size * 0.45,
                borderWidth: 2,
                borderColor: iconColor,
                borderTopLeftRadius: 2,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
              }}
            />
            {/* Wheels */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: size * 0.5,
                marginTop: 2,
              }}>
              <View
                style={{
                  width: size * 0.14,
                  height: size * 0.14,
                  borderRadius: (size * 0.14) / 2,
                  backgroundColor: iconColor,
                }}
              />
              <View
                style={{
                  width: size * 0.14,
                  height: size * 0.14,
                  borderRadius: (size * 0.14) / 2,
                  backgroundColor: iconColor,
                }}
              />
            </View>
          </View>
        );

      case 'lightning':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: size * 0.35,
                borderRightWidth: 0,
                borderBottomWidth: size * 0.45,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: iconColor,
                transform: [{ skewX: '-20deg' }],
              }}
            />
            <View
              style={{
                width: 0,
                height: 0,
                borderRightWidth: size * 0.35,
                borderLeftWidth: 0,
                borderTopWidth: size * 0.45,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: iconColor,
                marginTop: -size * 0.15,
                transform: [{ skewX: '-20deg' }],
              }}
            />
          </View>
        );

      case 'sparkle':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                position: 'absolute',
                width: size * 0.7,
                height: 2.5,
                backgroundColor: iconColor,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                position: 'absolute',
                height: size * 0.7,
                width: 2.5,
                backgroundColor: iconColor,
                borderRadius: 1,
              }}
            />
            <View
              style={{
                width: size * 0.35,
                height: size * 0.35,
                borderRadius: (size * 0.35) / 2,
                backgroundColor: active ? colors.warning : iconColor,
              }}
            />
          </View>
        );

      case 'cloud':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.8,
                height: size * 0.45,
                borderRadius: size * 0.25,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}20` : 'transparent',
              }}
            />
          </View>
        );

      case 'lock':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.4,
                height: size * 0.35,
                borderTopLeftRadius: size * 0.2,
                borderTopRightRadius: size * 0.2,
                borderWidth: 2,
                borderColor: iconColor,
                borderBottomWidth: 0,
                marginBottom: -1,
              }}
            />
            <View
              style={{
                width: size * 0.65,
                height: size * 0.45,
                borderRadius: 4,
                backgroundColor: active ? iconColor : 'transparent',
                borderWidth: 2,
                borderColor: iconColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: 3,
                  height: 5,
                  backgroundColor: active ? colors.white : iconColor,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );

      case 'search':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.55,
                height: size * 0.55,
                borderRadius: (size * 0.55) / 2,
                borderWidth: 2,
                borderColor: iconColor,
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: 2.5,
                height: size * 0.3,
                backgroundColor: iconColor,
                borderRadius: 1,
                bottom: size * 0.1,
                right: size * 0.1,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        );

      case 'check':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.8,
                height: size * 0.8,
                borderRadius: (size * 0.8) / 2,
                borderWidth: 2,
                borderColor: iconColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  width: size * 0.25,
                  height: size * 0.42,
                  borderBottomWidth: 2.5,
                  borderRightWidth: 2.5,
                  borderColor: iconColor,
                  transform: [{ rotate: '45deg' }, { translateY: -2 }],
                }}
              />
            </View>
          </View>
        );

      case 'folder':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.4,
                height: size * 0.2,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
                backgroundColor: iconColor,
                marginBottom: -1,
                alignSelf: 'flex-start',
                marginLeft: size * 0.1,
              }}
            />
            <View
              style={{
                width: size * 0.85,
                height: size * 0.55,
                borderRadius: 3,
                borderWidth: 2,
                borderColor: iconColor,
                backgroundColor: active ? `${iconColor}25` : 'transparent',
              }}
            />
          </View>
        );

      case 'clock':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.82,
                height: size * 0.82,
                borderRadius: (size * 0.82) / 2,
                borderWidth: 2,
                borderColor: iconColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <View
                style={{
                  position: 'absolute',
                  width: 2,
                  height: size * 0.28,
                  backgroundColor: iconColor,
                  top: size * 0.15,
                  borderRadius: 1,
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  width: size * 0.22,
                  height: 2,
                  backgroundColor: iconColor,
                  right: size * 0.18,
                  borderRadius: 1,
                }}
              />
            </View>
          </View>
        );

      case 'export':
      case 'import':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.75,
                height: size * 0.45,
                borderWidth: 2,
                borderTopWidth: 0,
                borderColor: iconColor,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
                alignItems: 'center',
              }}>
              <View
                style={{
                  width: 2.5,
                  height: size * 0.4,
                  backgroundColor: iconColor,
                  marginTop: name === 'export' ? -size * 0.25 : -size * 0.1,
                }}
              />
            </View>
          </View>
        );

      case 'logout':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.55,
                height: size * 0.8,
                borderWidth: 2,
                borderRightWidth: 0,
                borderColor: iconColor,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: size * 0.08,
                width: size * 0.35,
                height: 2.5,
                backgroundColor: iconColor,
              }}
            />
          </View>
        );

      case 'trash':
        return (
          <View style={[styles.center, { width: size, height: size }]}>
            <View
              style={{
                width: size * 0.7,
                height: 2.5,
                backgroundColor: iconColor,
                borderRadius: 1,
                marginBottom: 2,
              }}
            />
            <View
              style={{
                width: size * 0.55,
                height: size * 0.6,
                borderWidth: 2,
                borderTopWidth: 0,
                borderColor: iconColor,
                borderBottomLeftRadius: 3,
                borderBottomRightRadius: 3,
              }}
            />
          </View>
        );

      default:
        return (
          <View
            style={{
              width: size * 0.5,
              height: size * 0.5,
              borderRadius: size * 0.25,
              backgroundColor: iconColor,
            }}
          />
        );
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { rotate: rotation }],
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {renderIconGraphic()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
