// ═══════════════════════════════════════
// Floor Detail Screen
// ═══════════════════════════════════════

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { COLORS, getBiome, formatFloorNumber } from '@/constants/game';
import { Card, ProgressBar, TierBadge, EmptyState } from '@/components/ui';
import type { Floor, Contribution, UserProfile, TierLevel } from '@/types';

export default function FloorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [floor, setFloor] = useState<Floor | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [contributions, setContributions] = useState<(Contribution & { user: UserProfile })[]>([]);
  const [loading, setLoading] = useState(true);

  const floorId = parseInt(id || '1', 10);

  useEffect(() => {
    loadFloorData();
  }, [floorId]);

  const loadFloorData = async () => {
    setLoading(true);

    // Fetch floor
    const { data: floorData } = await supabase
      .from('floors').select('*').eq('id', floorId).single();

    if (floorData) {
      setFloor(floorData as Floor);

      // Fetch owner
      if (floorData.owner_id) {
        const { data: ownerData } = await supabase
          .from('profiles').select('*').eq('id', floorData.owner_id).single();
        if (ownerData) setOwner(ownerData as UserProfile);
      }

      // Fetch contributions
      const { data: contribData } = await supabase
        .from('contributions')
        .select('*, user:profiles(*)')
        .eq('floor_id', floorId)
        .order('amount', { ascending: false })
        .limit(20);

      if (contribData) {
        // Aggregate by user
        const byUser = new Map<string, { total: number; user: UserProfile }>();
        for (const c of contribData as any[]) {
          const existing = byUser.get(c.user_id);
          if (existing) {
            existing.total += c.amount;
          } else {
            byUser.set(c.user_id, { total: c.amount, user: c.user });
          }
        }
        const aggregated = Array.from(byUser.values())
          .sort((a, b) => b.total - a.total)
          .map((entry, i) => ({
            id: `agg-${i}`,
            floor_id: floorId,
            user_id: entry.user.id,
            amount: entry.total,
            created_at: '',
            user: entry.user,
          }));
        setContributions(aggregated as any);
      }
    }

    setLoading(false);
  };

  if (loading || !floor) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState emoji="⏳" title="Cargando piso..." />
      </SafeAreaView>
    );
  }

  const biome = getBiome(floorId);
  const isCompleted = floor.status === 'completed';
  const isSpecial = floor.is_special;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Floor number */}
        <View style={styles.header}>
          <Text style={styles.floorNumber}>
            {formatFloorNumber(floorId)}
          </Text>
          {isSpecial && floor.special_type && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialText}>
                {floor.special_type === 'golden' ? '⭐ PISO DORADO' :
                 floor.special_type === 'diamond' ? '💎 PISO DIAMANTE' :
                 floor.special_type === 'historic' ? '🏛️ PISO HISTÓRICO' :
                 floor.special_type === 'palindrome' ? '🔮 PALÍNDROMO' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Status + biome */}
        <View style={styles.infoRow}>
          <Card style={styles.infoCard}>
            <Text style={styles.infoLabel}>ESTADO</Text>
            <Text style={[styles.infoValue, { color: isCompleted ? COLORS.accentGreen : COLORS.accentCyan }]}>
              {isCompleted ? '✅ Completado' : '🏗️ En construcción'}
            </Text>
          </Card>
          <Card style={styles.infoCard}>
            <Text style={styles.infoLabel}>BIOMA</Text>
            <Text style={styles.infoValue}>
              {biome.emoji} {biome.name}
            </Text>
          </Card>
        </View>

        {/* Progress (if building) */}
        {!isCompleted && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>PROGRESO</Text>
            <ProgressBar progress={floor.progress} height={10} showLabel />
            <Text style={styles.progressDetail}>
              {floor.progress}/100 monedas · {100 - floor.progress} restantes
            </Text>
          </Card>
        )}

        {/* Completed time */}
        {isCompleted && floor.completed_at && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>COMPLETADO</Text>
            <Text style={styles.completedDate}>
              {new Date(floor.completed_at).toLocaleDateString('es-ES', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </Card>
        )}

        {/* Owner */}
        {owner && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>👑 DUEÑO DEL PISO</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                <Text style={{ fontSize: 20 }}>😎</Text>
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{owner.username}</Text>
                <TierBadge tier={owner.tier as TierLevel} size="sm" />
              </View>
              <Text style={styles.ownerCoins}>
                {floor.owner_contribution} 🪙
              </Text>
            </View>
          </Card>
        )}

        {/* Contributors */}
        {contributions.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>
              🔨 CONSTRUCTORES ({contributions.length})
            </Text>
            {contributions.map((c, i) => (
              <View key={c.id} style={[styles.contributorRow, i === 0 && { borderTopWidth: 0 }]}>
                <Text style={styles.contributorRank}>#{i + 1}</Text>
                <View style={styles.contributorAvatar}>
                  <Text style={{ fontSize: 14 }}>😎</Text>
                </View>
                <Text style={styles.contributorName} numberOfLines={1}>
                  {c.user?.username || 'Anónimo'}
                </Text>
                <Text style={styles.contributorAmount}>{c.amount} 🪙</Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  backBtn: { padding: 16 },
  backText: { fontSize: 14, color: COLORS.textSecondary },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 8, marginBottom: 20 },
  floorNumber: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 48, fontWeight: '900', color: COLORS.accentGlow,
    textShadowColor: 'rgba(108,92,231,0.3)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  specialBadge: {
    backgroundColor: 'rgba(240,192,64,0.1)', borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)',
    borderRadius: 50, paddingHorizontal: 14, paddingVertical: 6,
  },
  specialText: { fontSize: 12, fontWeight: '700', color: COLORS.accentGold, letterSpacing: 1 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoCard: { flex: 1, alignItems: 'center' },
  infoLabel: { fontSize: 10, color: COLORS.textDim, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 3, marginBottom: 12,
  },
  progressDetail: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  completedDate: { fontSize: 14, color: COLORS.textPrimary },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ownerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(240,192,64,0.1)', borderWidth: 2, borderColor: COLORS.accentGold,
    alignItems: 'center', justifyContent: 'center',
  },
  ownerInfo: { flex: 1, gap: 4 },
  ownerName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  ownerCoins: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 16, fontWeight: '700', color: COLORS.accentGold,
  },
  contributorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  contributorRank: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, color: COLORS.textDim, width: 24,
  },
  contributorAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.bgElevated, alignItems: 'center', justifyContent: 'center',
  },
  contributorName: { flex: 1, fontSize: 13, color: COLORS.textPrimary },
  contributorAmount: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 13, fontWeight: '700', color: COLORS.accentCyan,
  },
});
