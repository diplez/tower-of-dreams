// ═══════════════════════════════════════
// Profile Screen
// ═══════════════════════════════════════

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useWalletStore } from '@/lib/store';
import { COLORS, TIERS, getTier } from '@/constants/game';
import { Card, TierBadge, Button } from '@/components/ui';

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();
  const { wallet } = useWalletStore();

  if (!profile) return null;

  const tierConfig = getTier(profile.total_floors_owned);
  const nextTier = TIERS.find((t) => t.level === tierConfig.level + 1);
  const progressToNext = nextTier
    ? ((profile.total_floors_owned - tierConfig.minFloors) /
        (nextTier.minFloors - tierConfig.minFloors)) *
      100
    : 100;

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarLg}>
            <Text style={styles.avatarEmoji}>😎</Text>
          </View>
          <Text style={styles.username}>{profile.username}</Text>
          <TierBadge tier={profile.tier as any} size="lg" />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.total_floors_owned}</Text>
            <Text style={styles.statLabel}>Pisos propios</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.total_floors_contributed}</Text>
            <Text style={styles.statLabel}>Co-construidos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.streak_current}</Text>
            <Text style={styles.statLabel}>Racha días</Text>
          </View>
        </View>

        {/* Tier Progress */}
        {nextTier && (
          <Card style={styles.tierCard}>
            <Text style={styles.sectionTitle}>SIGUIENTE TIER</Text>
            <View style={styles.tierProgress}>
              <Text style={styles.tierCurrent}>
                {tierConfig.emoji} {tierConfig.name}
              </Text>
              <Text style={styles.tierArrow}>→</Text>
              <Text style={styles.tierNext}>
                {nextTier.emoji} {nextTier.name}
              </Text>
            </View>
            <View style={styles.tierBar}>
              <View style={[styles.tierBarFill, { width: `${Math.min(progressToNext, 100)}%` }]} />
            </View>
            <Text style={styles.tierFloorsLeft}>
              {nextTier.minFloors - profile.total_floors_owned} pisos más para {nextTier.name}
            </Text>
          </Card>
        )}

        {/* Streak */}
        <Card style={styles.streakCard}>
          <View style={styles.streakRow}>
            <Text style={styles.streakFire}>🔥</Text>
            <View>
              <Text style={styles.streakValue}>{profile.streak_current} días</Text>
              <Text style={styles.streakLabel}>Racha actual</Text>
            </View>
          </View>
        </Card>

        {/* Wallet */}
        <Card style={styles.walletCard}>
          <Text style={styles.sectionTitle}>MONEDERO</Text>
          <View style={styles.walletRow}>
            <Text style={styles.walletEmoji}>🪙</Text>
            <Text style={styles.walletAmount}>
              {(wallet?.balance || 0).toLocaleString()}
            </Text>
            <Text style={styles.walletLabel}>monedas</Text>
          </View>
          <Text style={styles.walletTotal}>
            Total comprado: {(wallet?.total_purchased || 0).toLocaleString()} monedas
          </Text>
        </Card>

        {/* Badges (placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BADGES</Text>
          <View style={styles.badgesGrid}>
            {TIERS.slice(0, profile.tier).map((t) => (
              <View key={t.level} style={styles.badgeEarned}>
                <Text style={styles.badgeEmoji}>{t.emoji}</Text>
              </View>
            ))}
            {TIERS.slice(profile.tier).map((t) => (
              <View key={t.level} style={styles.badgeLocked}>
                <Text style={styles.badgeEmoji}>{t.emoji}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  avatarLg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.12)',
    borderWidth: 3,
    borderColor: COLORS.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  username: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.accentCyan,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textDim,
    marginTop: 4,
  },
  tierCard: {
    marginBottom: 12,
  },
  tierProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  tierCurrent: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tierArrow: {
    fontSize: 16,
    color: COLORS.textDim,
  },
  tierNext: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accentGlow,
  },
  tierBar: {
    height: 6,
    backgroundColor: COLORS.bgElevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tierBarFill: {
    height: '100%',
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 3,
  },
  tierFloorsLeft: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  streakCard: {
    marginBottom: 12,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakFire: {
    fontSize: 32,
  },
  streakValue: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.accentGold,
  },
  streakLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  walletCard: {
    marginBottom: 16,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  walletEmoji: {
    fontSize: 24,
  },
  walletAmount: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.accentGold,
  },
  walletLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  walletTotal: {
    fontSize: 11,
    color: COLORS.textDim,
    marginTop: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 3,
    marginBottom: 12,
  },
  badgesGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeEarned: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLocked: {
    width: 52,
    height: 52,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  logoutBtn: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.accentRed,
    fontWeight: '600',
  },
});
