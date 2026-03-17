// ═══════════════════════════════════════
// AnimationOverlay — Celebration animations
// ═══════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { COLORS } from '@/constants/game';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface AnimationOverlayProps {
  level: string; // standard | minor | medium | epic | legendary
  floorNumber: number;
  onComplete: () => void;
}

// Particle component for confetti/sparkles
function Particle({ delay, color, size, startX }: {
  delay: number; color: string; size: number; startX: number;
}) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const wobble = (Math.random() - 0.5) * 120;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_H + 50,
        duration: 2500 + Math.random() * 1500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: wobble,
        duration: 2500 + Math.random() * 1500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 2000,
        delay: delay + 1500,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: Math.random() * 4 - 2,
        duration: 2500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: startX,
        top: -20,
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: color,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { rotate: rotate.interpolate({ inputRange: [-2, 2], outputRange: ['-360deg', '360deg'] }) },
        ],
      }}
    />
  );
}

export function AnimationOverlay({ level, floorNumber, onComplete }: AnimationOverlayProps) {
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.3)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const [showSkip, setShowSkip] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number; color: string; size: number; startX: number; delay: number;
  }>>([]);

  const config = getAnimationConfig(level);

  useEffect(() => {
    // Generate particles
    const colors = config.colors;
    const newParticles = Array.from({ length: config.particleCount }, (_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      startX: Math.random() * SCREEN_W,
      delay: Math.random() * 800,
    }));
    setParticles(newParticles);

    // Animate in
    Animated.sequence([
      // Flash
      Animated.timing(overlayOpacity, {
        toValue: 1, duration: 200, useNativeDriver: true,
      }),
      // Glow burst
      Animated.spring(glowScale, {
        toValue: 1, friction: 6, tension: 40, useNativeDriver: true,
      }),
      // Title entrance
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1, friction: 5, tension: 50, useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1, duration: 300, useNativeDriver: true,
        }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
    ]).start();

    // Show skip button
    const skipTimer = setTimeout(() => setShowSkip(true), config.skipAfter);

    // Auto-dismiss
    const autoTimer = setTimeout(onComplete, config.duration);

    return () => {
      clearTimeout(skipTimer);
      clearTimeout(autoTimer);
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Dark overlay */}
      <Animated.View style={[styles.overlay, { opacity: Animated.multiply(overlayOpacity, config.overlayOpacity) }]} />

      {/* Particles */}
      {particles.map((p) => (
        <Particle key={p.id} delay={p.delay} color={p.color} size={p.size} startX={p.startX} />
      ))}

      {/* Center glow */}
      <Animated.View style={[styles.glow, {
        backgroundColor: config.glowColor,
        transform: [{ scale: glowScale }],
        opacity: Animated.multiply(overlayOpacity, 0.15),
      }]} />

      {/* Content */}
      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, {
          opacity: titleOpacity,
          transform: [{ scale: titleScale }],
        }]}>
          {config.emoji}
        </Animated.Text>

        <Animated.Text style={[styles.title, {
          opacity: titleOpacity,
          transform: [{ scale: titleScale }],
          color: config.titleColor,
          fontSize: config.titleSize,
        }]}>
          {config.title}
        </Animated.Text>

        <Animated.Text style={[styles.floorText, { opacity: subtitleOpacity }]}>
          PISO {floorNumber.toLocaleString()}
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          {config.subtitle}
        </Animated.Text>
      </View>

      {/* Skip button */}
      {showSkip && (
        <TouchableOpacity style={styles.skipBtn} onPress={onComplete}>
          <Text style={styles.skipText}>Continuar →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Animation configs per level ──

interface AnimConfig {
  emoji: string;
  title: string;
  subtitle: string;
  titleColor: string;
  titleSize: number;
  glowColor: string;
  colors: string[];
  particleCount: number;
  duration: number;
  skipAfter: number;
  overlayOpacity: number;
}

function getAnimationConfig(level: string): AnimConfig {
  switch (level) {
    case 'minor':
      return {
        emoji: '🎉',
        title: '¡HITO!',
        subtitle: '¡Cada 100 pisos cuenta!',
        titleColor: COLORS.accentCyan,
        titleSize: 32,
        glowColor: COLORS.accentCyan,
        colors: [COLORS.accentCyan, COLORS.accentGlow, '#fff', COLORS.accentGold],
        particleCount: 25,
        duration: 4000,
        skipAfter: 1500,
        overlayOpacity: 0.6,
      };
    case 'medium':
      return {
        emoji: '🏆',
        title: '¡INCREÍBLE!',
        subtitle: '¡1,000 pisos más cerca del cielo!',
        titleColor: COLORS.accentGold,
        titleSize: 36,
        glowColor: COLORS.accentGold,
        colors: [COLORS.accentGold, '#fff', COLORS.accentGlow, COLORS.accentCyan, COLORS.accentPink],
        particleCount: 50,
        duration: 8000,
        skipAfter: 3000,
        overlayOpacity: 0.7,
      };
    case 'epic':
      return {
        emoji: '⚡',
        title: '¡ÉPICO!',
        subtitle: '¡La torre toca las nubes!',
        titleColor: '#fff',
        titleSize: 42,
        glowColor: COLORS.accentPrimary,
        colors: [COLORS.accentGold, COLORS.accentCyan, COLORS.accentPink, '#fff', COLORS.accentGlow, COLORS.accentGreen],
        particleCount: 80,
        duration: 15000,
        skipAfter: 5000,
        overlayOpacity: 0.8,
      };
    case 'legendary':
      return {
        emoji: '👑',
        title: '¡LEGENDARIO!',
        subtitle: '¡Un nuevo bioma se desbloquea!',
        titleColor: COLORS.accentGold,
        titleSize: 48,
        glowColor: COLORS.accentGold,
        colors: [COLORS.accentGold, '#fff', COLORS.accentGlow, COLORS.accentCyan, COLORS.accentPink, COLORS.accentGreen, '#ff6b6b'],
        particleCount: 120,
        duration: 30000,
        skipAfter: 10000,
        overlayOpacity: 0.85,
      };
    case 'special':
      return {
        emoji: '🌟',
        title: '¡LA MITAD!',
        subtitle: '500,000 pisos. El viaje continúa.',
        titleColor: '#fff',
        titleSize: 52,
        glowColor: '#fff',
        colors: [COLORS.accentGold, '#fff', COLORS.accentGlow, COLORS.accentCyan, COLORS.accentPink, '#ff6b6b', COLORS.accentGreen],
        particleCount: 150,
        duration: 60000,
        skipAfter: 10000,
        overlayOpacity: 0.9,
      };
    case 'grand_final':
      return {
        emoji: '🏗️✨',
        title: '¡COMPLETA!',
        subtitle: '1,000,000 de pisos. Lo logramos juntos.',
        titleColor: COLORS.accentGold,
        titleSize: 56,
        glowColor: COLORS.accentGold,
        colors: [COLORS.accentGold, '#fff', COLORS.accentGlow, COLORS.accentCyan, COLORS.accentPink, '#ff6b6b', COLORS.accentGreen],
        particleCount: 200,
        duration: 120000,
        skipAfter: 15000,
        overlayOpacity: 0.95,
      };
    default: // standard
      return {
        emoji: '✅',
        title: '¡COMPLETADO!',
        subtitle: '',
        titleColor: COLORS.accentCyan,
        titleSize: 24,
        glowColor: COLORS.accentCyan,
        colors: [COLORS.accentCyan, '#fff'],
        particleCount: 10,
        duration: 2000,
        skipAfter: 500,
        overlayOpacity: 0.4,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  glow: {
    position: 'absolute',
    width: SCREEN_W * 1.5,
    height: SCREEN_W * 1.5,
    borderRadius: SCREEN_W,
  },
  content: {
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  floorText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 3,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  skipBtn: {
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
    zIndex: 20,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
