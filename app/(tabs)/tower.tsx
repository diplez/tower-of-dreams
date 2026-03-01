// ═══════════════════════════════════════
// Tower Screen — Main experience
// ═══════════════════════════════════════

import { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTowerStore, useWalletStore, useAuthStore } from '@/lib/store';
import { COLORS, formatFloorNumber, getBiome, TOWER_MAX_FLOORS } from '@/constants/game';
import { ProgressBar, CoinDisplay } from '@/components/ui';
import { FloorList } from '@/components/tower/FloorList';

export default function TowerScreen() {
  const router = useRouter();
  const { towerState, currentFloor } = useTowerStore();
  const { wallet } = useWalletStore();
  const { profile } = useAuthStore();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for build button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const currentFloorNum = towerState?.current_floor || 1;
  const progress = currentFloor?.progress || 0;
  const globalProgress = ((currentFloorNum - 1) / TOWER_MAX_FLOORS) * 100;
  const biome = getBiome(currentFloorNum);

  // Calculate next milestone
  const getNextMilestone = (floor: number) => {
    const milestones = [100, 1000, 10000, 100000, 500000, 1000000];
    for (const m of milestones) {
      if (floor < m) return m;
    }
    return 1000000;
  };

  const nextMilestone = getNextMilestone(currentFloorNum);
  const floorsToMilestone = nextMilestone - currentFloorNum;

  const handleBuild = useCallback(() => {
    router.push('/floor/build');
  }, []);

  return (
    <View style={styles.container}>
      {/* Background gradient based on biome */}
      <View style={[styles.bg, { backgroundColor: biome.bgGradient[0] }]} />

      {/* Stars / particles */}
      <View style={styles.stars}>
        {Array.from({ length: 30 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.1,
              },
            ]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* HUD Top */}
        <View style={styles.hudTop}>
          <View style={styles.hudRow}>
            <View style={styles.floorCounter}>
              <Text style={styles.floorCounterText}>
                PISO {formatFloorNumber(currentFloorNum)}
              </Text>
            </View>
            <CoinDisplay amount={wallet?.balance || 0} size="md" />
          </View>

          {/* Global progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso global</Text>
              <Text style={styles.progressValue}>
                {formatFloorNumber(currentFloorNum)} / {formatFloorNumber(TOWER_MAX_FLOORS)}
              </Text>
            </View>
            <ProgressBar progress={globalProgress} height={5} />
            <Text style={styles.milestoneText}>
              ⚡ Próximo hito: {formatFloorNumber(nextMilestone)} — faltan {formatFloorNumber(floorsToMilestone)}
            </Text>
          </View>
        </View>

        {/* Tower visualization */}
        <View style={styles.towerContainer}>
          <FloorList
            currentFloor={currentFloorNum}
            currentProgress={progress}
            biome={biome}
          />
        </View>

        {/* Online users */}
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>
            {towerState?.total_unique_builders || 0} constructores
          </Text>
        </View>

        {/* Build CTA */}
        <View style={styles.ctaContainer}>
          <Animated.View style={{ flex: 1, transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity style={styles.btnBuild} onPress={handleBuild}>
              <Text style={styles.btnBuildText}>⚡ CONSTRUIR</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={styles.btnChat}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.btnChatText}>💬</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  stars: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  safeArea: {
    flex: 1,
  },
  hudTop: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
    zIndex: 10,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floorCounter: {
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 50,
  },
  floorCounterText: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentGlow,
    letterSpacing: 2,
  },
  progressCard: {
    backgroundColor: 'rgba(14, 16, 25, 0.7)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressValue: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11,
    color: COLORS.accentCyan,
    fontVariant: ['tabular-nums'],
  },
  milestoneText: {
    fontSize: 11,
    color: COLORS.accentGold,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  towerContainer: {
    flex: 1,
    marginTop: 10,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentGreen,
  },
  onlineText: {
    fontSize: 11,
    color: COLORS.textDim,
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  btnBuild: {
    backgroundColor: COLORS.accentPrimary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    shadowColor: COLORS.accentPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  btnBuildText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 3,
  },
  btnChat: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnChatText: {
    fontSize: 22,
  },
});
