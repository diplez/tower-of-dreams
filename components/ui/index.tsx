// ═══════════════════════════════════════
// UI Components — Design System
// ═══════════════════════════════════════

import { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '@/constants/game';
import type { TierLevel } from '@/types';
import { TIERS } from '@/constants/game';

// ── BUTTON ──
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const btnStyles = [
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    disabled && styles.btnDisabled,
    style,
  ];

  const textStyles = [
    styles.btnText,
    styles[`btnText_${variant}`],
    styles[`btnText_${size}`],
  ];

  return (
    <TouchableOpacity
      style={btnStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : COLORS.accentPrimary}
        />
      ) : (
        <Text style={textStyles}>
          {icon ? `${icon}  ${title}` : title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── CARD ──
interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  glow?: boolean;
}

export function Card({ children, style, onPress, glow }: CardProps) {
  const cardStyle = [
    styles.card,
    glow && styles.cardGlow,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

// ── PROGRESS BAR ──
interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  showLabel?: boolean;
}

export function ProgressBar({
  progress,
  height = 6,
  color,
  showLabel = false,
}: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBg, { height }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${clampedProgress}%`,
              height,
              backgroundColor: color || COLORS.accentCyan,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={styles.progressLabel}>{Math.floor(clampedProgress)}%</Text>
      )}
    </View>
  );
}

// ── TIER BADGE ──
interface TierBadgeProps {
  tier: TierLevel;
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const tierConfig = TIERS.find((t) => t.level === tier) || TIERS[0];

  return (
    <View
      style={[
        styles.tierBadge,
        styles[`tierBadge_${size}`],
        { borderColor: tierConfig.color + '50' },
      ]}
    >
      <Text style={styles.tierEmoji}>{tierConfig.emoji}</Text>
      {size !== 'sm' && (
        <Text style={[styles.tierName, { color: tierConfig.color }]}>
          {tierConfig.name.toUpperCase()}
        </Text>
      )}
    </View>
  );
}

// ── AVATAR ──
interface AvatarProps {
  url?: string | null;
  emoji?: string;
  size?: number;
  borderColor?: string;
}

export function Avatar({ emoji = '😎', size = 40, borderColor }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: borderColor || COLORS.border,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
    </View>
  );
}

// ── SECTION TITLE ──
export function SectionTitle({ title, style }: { title: string; style?: TextStyle }) {
  return <Text style={[styles.sectionTitle, style]}>{title}</Text>;
}

// ── COIN DISPLAY ──
export function CoinDisplay({ amount, size = 'md' }: { amount: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <View style={[styles.coinDisplay, styles[`coinDisplay_${size}`]]}>
      <Text style={styles.coinEmoji}>🪙</Text>
      <Text style={[styles.coinAmount, styles[`coinAmount_${size}`]]}>
        {amount.toLocaleString()}
      </Text>
    </View>
  );
}

// ── EMPTY STATE ──
export function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════

const styles = StyleSheet.create({
  // Button
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btn_primary: {
    backgroundColor: COLORS.accentPrimary,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btn_secondary: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btn_ghost: {
    backgroundColor: 'transparent',
  },
  btn_gold: {
    backgroundColor: COLORS.accentGold,
    shadowColor: COLORS.accentGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btn_sm: { paddingVertical: 10, paddingHorizontal: 16 },
  btn_md: { paddingVertical: 14, paddingHorizontal: 24 },
  btn_lg: { paddingVertical: 18, paddingHorizontal: 32 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontWeight: '700', letterSpacing: 2 },
  btnText_primary: { color: '#fff' },
  btnText_secondary: { color: COLORS.textPrimary },
  btnText_ghost: { color: COLORS.accentGlow },
  btnText_gold: { color: '#000' },
  btnText_sm: { fontSize: 12 },
  btnText_md: { fontSize: 14 },
  btnText_lg: { fontSize: 16 },

  // Card
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
  },
  cardGlow: {
    borderColor: COLORS.borderGlow,
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBg: {
    flex: 1,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 3,
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontVariant: ['tabular-nums'],
    width: 32,
    textAlign: 'right',
  },

  // Tier Badge
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tierBadge_sm: { paddingHorizontal: 6, paddingVertical: 2 },
  tierBadge_md: { paddingHorizontal: 10, paddingVertical: 4 },
  tierBadge_lg: { paddingHorizontal: 14, paddingVertical: 6 },
  tierEmoji: { fontSize: 12 },
  tierName: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  // Avatar
  avatar: {
    backgroundColor: COLORS.bgElevated,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Coin Display
  coinDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(240, 192, 64, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.15)',
    borderRadius: 50,
  },
  coinDisplay_sm: { paddingHorizontal: 8, paddingVertical: 4 },
  coinDisplay_md: { paddingHorizontal: 12, paddingVertical: 6 },
  coinDisplay_lg: { paddingHorizontal: 16, paddingVertical: 8 },
  coinEmoji: { fontSize: 14 },
  coinAmount: { color: COLORS.accentGold, fontWeight: '800', fontVariant: ['tabular-nums'] },
  coinAmount_sm: { fontSize: 12 },
  coinAmount_md: { fontSize: 14 },
  coinAmount_lg: { fontSize: 18 },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
});
