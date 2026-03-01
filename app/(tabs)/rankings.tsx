// ═══════════════════════════════════════
// Rankings Screen
// ═══════════════════════════════════════

import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, useRankingsStore } from '@/lib/store';
import { COLORS, TIERS } from '@/constants/game';
import { EmptyState } from '@/components/ui';
import type { RankedUser, TierLevel } from '@/types';

export default function RankingsScreen() {
  const { profile } = useAuthStore();
  const { rankings, myRank, isLoading, fetchRankings } = useRankingsStore();

  const loadRankings = useCallback(() => {
    fetchRankings(profile?.id);
  }, [profile?.id]);

  useEffect(() => { loadRankings(); }, [loadRankings]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  const getTierConfig = (tier: TierLevel) => TIERS.find((t) => t.level === tier) || TIERS[0];

  const renderTop3 = () => {
    if (top3.length === 0) return null;
    const ordered = [top3[1], top3[0], top3[2]].filter(Boolean);

    return (
      <View style={styles.podium}>
        {ordered.map((user, idx) => {
          const isFirst = idx === 1;
          const position = isFirst ? 1 : idx === 0 ? 2 : 3;
          const colors = ['#c0c0c0', COLORS.accentGold, '#cd7f32'];
          const color = colors[position - 1];
          return (
            <View key={user.id} style={[styles.podiumCard, isFirst && styles.podiumFirst]}>
              <View style={[styles.podiumAvatar, isFirst && styles.podiumAvatarFirst, { borderColor: color }]}>
                <Text style={{ fontSize: isFirst ? 24 : 18 }}>{['🧙', '👸', '🦊'][position - 1]}</Text>
              </View>
              <Text style={[styles.podiumPosition, { color }]}>
                {position === 1 ? '👑 ' : ''}#{position}
              </Text>
              <Text style={styles.podiumName} numberOfLines={1}>{user.username}</Text>
              <Text style={styles.podiumFloors}>{user.total_floors_owned} pisos</Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderRankRow = ({ item }: { item: RankedUser }) => {
    const isMe = item.id === profile?.id;
    const tierConfig = getTierConfig(item.tier as TierLevel);
    return (
      <View style={[styles.rankRow, isMe && styles.rankRowMe]}>
        <Text style={[styles.rankNum, isMe && { color: COLORS.accentGlow }]}>{item.position}</Text>
        <View style={styles.rankAvatar}><Text style={{ fontSize: 16 }}>😎</Text></View>
        <View style={styles.rankInfo}>
          <Text style={[styles.rankName, isMe && { color: COLORS.accentGlow }]} numberOfLines={1}>
            {isMe ? `tú · ${item.username}` : item.username}
          </Text>
          <Text style={styles.rankTier}>{tierConfig.emoji} {tierConfig.name}</Text>
        </View>
        <View style={styles.rankScore}>
          <Text style={[styles.rankFloors, isMe && { color: COLORS.accentGlow }]}>
            {item.total_floors_owned.toLocaleString()}
          </Text>
          <Text style={styles.rankLabel}>pisos</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState emoji="⏳" title="Cargando rankings..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={rest}
        renderItem={renderRankRow}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>🏆 RANKINGS</Text>
            {renderTop3()}
            {rest.length > 0 && <View style={styles.divider} />}
          </>
        }
        ListEmptyComponent={
          <EmptyState emoji="🏗️" title="Sin rankings aún" subtitle="¡Sé el primero en construir!" />
        }
        ListFooterComponent={
          myRank && myRank.position > 3 ? (
            <View style={styles.myRankFooter}>
              <View style={styles.footerDivider} />
              <Text style={styles.footerLabel}>TU POSICIÓN</Text>
              {renderRankRow({ item: myRank })}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={loadRankings} tintColor={COLORS.accentGlow} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  listContent: { paddingBottom: 32 },
  title: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: 3, paddingTop: 16, marginBottom: 8,
  },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 12, paddingHorizontal: 16, paddingVertical: 20 },
  podiumCard: { alignItems: 'center', gap: 4, flex: 1 },
  podiumFirst: { marginBottom: 12 },
  podiumAvatar: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center',
  },
  podiumAvatarFirst: {
    width: 64, height: 64, borderRadius: 32,
    shadowColor: COLORS.accentGold, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 16,
  },
  podiumPosition: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, fontWeight: '800', letterSpacing: 1,
  },
  podiumName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, maxWidth: 100 },
  podiumFloors: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 10, color: COLORS.textSecondary,
  },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16, marginBottom: 8 },
  rankRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginVertical: 3,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, gap: 12,
  },
  rankRowMe: { borderColor: COLORS.accentPrimary, backgroundColor: 'rgba(108, 92, 231, 0.08)' },
  rankNum: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 13, fontWeight: '700', color: COLORS.textDim, width: 24, textAlign: 'center',
  },
  rankAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  rankTier: { fontSize: 10, color: COLORS.textDim, marginTop: 1 },
  rankScore: { alignItems: 'flex-end' },
  rankFloors: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 15, fontWeight: '700', color: COLORS.accentCyan,
  },
  rankLabel: { fontSize: 9, color: COLORS.textDim },
  myRankFooter: { marginTop: 8 },
  footerDivider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16, marginBottom: 8 },
  footerLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textDim, letterSpacing: 2, textAlign: 'center', marginBottom: 6 },
});
