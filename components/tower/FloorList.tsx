// ═══════════════════════════════════════
// FloorList — Virtualized tower floors
// ═══════════════════════════════════════

import { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { COLORS } from '@/constants/game';
import type { BiomeConfig } from '@/types';

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
}

export function FloorList({ currentFloor, currentProgress, biome }: FloorListProps) {
  // Generate visible floor data (current + 20 below)
  const floors = useMemo(() => {
    const items: FloorData[] = [];
    // Show current floor + some completed floors below
    const startFloor = Math.max(1, currentFloor - 25);

    for (let i = currentFloor + 2; i >= startFloor; i--) {
      items.push({
        id: i,
        isBuilding: i === currentFloor,
        isCompleted: i < currentFloor,
        isGolden: i % 1000 === 0 && i > 0,
        isDiamond: i % 10000 === 0 && i > 0,
      });
    }
    return items;
  }, [currentFloor]);

  const renderFloor = ({ item }: { item: FloorData }) => {
    if (item.id > currentFloor) {
      // Future floor (ghosted)
      return (
        <View style={[styles.floor, styles.floorFuture]}>
          <Text style={styles.floorLabelDim}>{item.id.toLocaleString()}</Text>
        </View>
      );
    }

    if (item.isBuilding) {
      return (
        <View style={[styles.floor, styles.floorBuilding]}>
          <View style={styles.buildingContent}>
            <Text style={styles.craneIcon}>🏗️</Text>
            <Text style={styles.floorLabelBuilding}>
              {item.id.toLocaleString()} · {currentProgress}%
            </Text>
          </View>
          {/* Progress fill */}
          <View
            style={[
              styles.buildingProgressFill,
              { width: `${currentProgress}%` },
            ]}
          />
        </View>
      );
    }

    // Completed floor
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
      <View
        style={[
          styles.floor,
          styles.floorCompleted,
          item.id % 2 === 0 && styles.floorCompletedAlt,
        ]}
      >
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
        initialScrollIndex={2} // Start at building floor
        getItemLayout={(_, index) => ({
          length: 28,
          offset: 28 * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 60,
    paddingVertical: 20,
  },
  floor: {
    width: 220,
    height: 24,
    marginVertical: 1,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floorFuture: {
    backgroundColor: 'rgba(30, 34, 53, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(30, 34, 53, 0.3)',
    borderStyle: 'dashed',
  },
  floorBuilding: {
    height: 34,
    borderWidth: 1,
    borderColor: COLORS.accentCyan,
    backgroundColor: 'rgba(0, 206, 201, 0.08)',
    overflow: 'hidden',
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  buildingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  craneIcon: {
    fontSize: 14,
  },
  buildingProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 206, 201, 0.12)',
    borderRadius: 3,
  },
  floorCompleted: {
    backgroundColor: 'rgba(26, 21, 69, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.15)',
  },
  floorCompletedAlt: {
    backgroundColor: 'rgba(24, 19, 64, 0.5)',
    borderColor: 'rgba(108, 92, 231, 0.1)',
  },
  floorGolden: {
    backgroundColor: 'rgba(42, 32, 5, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.3)',
    shadowColor: COLORS.accentGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  floorDiamond: {
    backgroundColor: 'rgba(20, 30, 50, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(162, 155, 254, 0.3)',
    shadowColor: COLORS.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  floorLabel: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  floorLabelDim: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9,
    color: 'rgba(255,255,255,0.15)',
    letterSpacing: 1,
  },
  floorLabelBuilding: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 10,
    color: COLORS.accentCyan,
    fontWeight: '700',
    letterSpacing: 1,
  },
  floorLabelGolden: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9,
    color: COLORS.accentGold,
    fontWeight: '600',
    letterSpacing: 1,
  },
  floorLabelDiamond: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 9,
    color: COLORS.accentGlow,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
