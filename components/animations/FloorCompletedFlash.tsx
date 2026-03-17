// ═══════════════════════════════════════
// FloorCompletedFlash — Quick flash on standard floor complete
// ═══════════════════════════════════════

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '@/constants/game';

const { width: SCREEN_W } = Dimensions.get('window');

interface FloorCompletedFlashProps {
  onComplete: () => void;
}

export function FloorCompletedFlash({ onComplete }: FloorCompletedFlashProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0.6, duration: 150, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.2, friction: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 2, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(onComplete);
  }, []);

  return (
    <Animated.View
      style={[
        styles.flash,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  flash: {
    position: 'absolute',
    width: SCREEN_W * 0.8,
    height: SCREEN_W * 0.8,
    borderRadius: SCREEN_W,
    backgroundColor: COLORS.accentCyan,
    alignSelf: 'center',
    top: '40%',
    left: '10%',
    zIndex: 50,
  },
});
