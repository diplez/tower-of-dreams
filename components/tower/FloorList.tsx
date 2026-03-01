// ═══════════════════════════════════════
// FloorList — Virtualized tower floors
// ═══════════════════════════════════════

import { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Platform, Animated } from 'react-native';
import { COLORS } from '@/constants/game';
import { useTowerStore } from '@/lib/store';
import type { BiomeConfig, Floor } from '@/types';

interface FloorListProps {
  currentFloor: number;
  currentProgress: number;
  biome: BiomeConfig;
}

interface FloorData {
  id: number;
  isBuilding: boolean;
  isCompleted: boolean;
  isGolden: boolean;
  isDiamond: boolean;
  isFuture: boolean;
  progress: number;
}

export function FloorList({ currentFloor, currentProgress, biome }: FloorListProps) {
  const { visibleFloors, fetchFloors } = useTowerStore();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // Fetch floors from Supabase
  useEffect(() => {
    fetchFloors(currentFloor);
  }, [currentFloor]);

  // Pulse animation for building floor
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Build display list: real floors from DB + future placeholders
  const floors = useMemo(() => {
    const items: FloorData[] = [];

    // Add 2 future floors above current
    for (let i = currentFloor + 2; i > currentFloor; i--) {
      items.push({
        id: i, isBuilding: false, isCompleted: false,
        isGolden: false, isDiamond: false, isFuture: true, progress: 0,
      });
    }

    // Building floor
    items.push({
      id: currentFloor, isBuilding: true, isCompleted: false,
      isGolden: currentFloor % 1000 === 0, isDiamond: currentFloor % 10000 === 0,
      isFuture: false, progress: currentProgress,
    });

    // Completed floors from DB
    const completed = visibleFloors
      .filter((f) => f.status === 'completed')
      .sort((a, b) => b.id - a.id);

    for (const floor of completed) {
      items.push({
        id: floor.id, isBuilding: false, isCompleted: true,
        isGolden: floor.special_type === 'golden' || floor.id % 1000 === 0,
        isDiamond: floor.special_type === 'diamond' || floor.id % 10000 === 0,
        isFuture: false, progress: 100,
      });
    }

    // If no completed floors in DB yet, show placeholder completed floors
    if (completed.length === 0 && currentFloor > 1) {
      for (let i = currentFloor - 1; i >= Math.max(1, currentFloor - 20); i--) {
        items.push({
          id: i, isBuilding: false, isCompleted: true,
          isGolden: i % 1000 === 0, isDiamond: i % 10000 === 0,
          isFuture: false, progress: 100,
        });
      }
    }

    return items;
  }, [currentFloor, currentProgress, visibleFloors]);

  const renderFloor = ({ item }: { item: FloorData }) => {
    if (item.isFuture) {
      return (
        <View style={[styles.floor, styles.floorFuture]}>
          <Text style={styles.floorLabelDim}>{item.id.toLocaleString()}</Text>
        </View>
      );
    }

    if (item.isBuilding) {
      return (
        <Animated.View style={[styles.floor, styles.floorBuilding, { opacity: Animated.add(0.6, Animated.multiply(pulseAnim, 0.4)) }]}>
          <View style={styles.buildingContent}>
            <Text style={styles.craneIcon}>🏗️</Text>
            <Text style={styles.floorLabelBuilding}>
              {item.id.toLocaleString()} · {item.progress}%
            </Text>
          </View>
          <View style={[styles.buildingProgressFill, { width: `${item.progress}%` }]} />
        </Animated.View>
      );
    }

    // Completed floors
    if (item.isDiamond) {
      return (
        <View style={[styles.floor, styles.floorDiamond]}>
          <Text style={styles.floorLabelDiamond}>💎 {item.id.toLocaleString()}</Text>
        </View>
      );
    }

    if (item.isGolden) {
      return (
        <View style={[styles.floor, styles.floorGolden]}>
          <Text style={styles.floorLabelGolden}>⭐ {item.id.toLocaleString()}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.floor, styles.floorCompleted, item.id % 2 === 0 && styles.floorCompletedAlt]}>
        <Text style={styles.floorLabel}>{item.id.toLocaleString()}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={floors}
        renderItem={renderFloor}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialScrollIndex={Math.min(2, floors.length - 1)}
        getItemLayout={(_, index) => ({ length: 28, offset: 28 * index, index })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  listContent: { paddingHorizontal: 60, paddingVertical: 20 },
  floor: {
    width: 220, height: 24, marginVertical: 1, borderRadius: 3,
    justifyContent: 'center', alignItems: 'center',
  },
  floorFuture: {
    backgroundColor: 'rgba(30, 34, 53, 0.2)', borderWidth: 1,
    borderColor: 'rgba(30, 34, 53, 0.3)', borderStyle: 'dashed',
  },
  floorBuilding: {
    height: 34, borderWidth: 1, borderColor: COLORS.accentCyan,
    backgroundColor: 'rgba(0, 206, 201, 0.08)', overflow: 'hidden',
    shadowColor: COLORS.accentCyan, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
  },
  buildingContent: { flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 2 },
  craneIcon: { fontSize: 14 },
  buildingProgressFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0, 206, 201, 0.12)', borderRadius: 3,
  },
  floorCompleted: {
    backgroundColor: 'rgba(26, 21, 69, 0.6)', borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.15)',
  },
  floorCompletedAlt: {
    backgroundColor: 'rgba(24, 19, 64, 0.5)', borderColor: 'rgba(108, 92, 231, 0.1)',
  },
  floorGolden: {
    backgroundColor: 'rgba(42, 32, 5, 0.6)', borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.3)',
    shadowColor: COLORS.accentGold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  floorDiamond: {
    backgroundColor: 'rgba(20, 30, 50, 0.6)', borderWidth: 1,
    borderColor: 'rgba(162, 155, 254, 0.3)',
    shadowColor: COLORS.accentGlow, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  floorLabel: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1,
  },
  floorLabelDim: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: 1,
  },
  floorLabelBuilding: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 10, color: COLORS.accentCyan, fontWeight: '700', letterSpacing: 1,
  },
  floorLabelGolden: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9, color: COLORS.accentGold, fontWeight: '600', letterSpacing: 1,
  },
  floorLabelDiamond: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9, color: COLORS.accentGlow, fontWeight: '600', letterSpacing: 1,
  },
});
