// ═══════════════════════════════════════
// Build Screen — Contribute to floor
// ═══════════════════════════════════════

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTowerStore, useWalletStore, useAuthStore } from '@/lib/store';
import { COLORS, formatFloorNumber, getBiome } from '@/constants/game';
import { Button, ProgressBar, CoinDisplay } from '@/components/ui';

const AMOUNTS = [50, 75, 100];

export default function BuildScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { towerState, currentFloor, contributeToFloor } = useTowerStore();
  const { wallet } = useWalletStore();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [building, setBuilding] = useState(false);

  const currentFloorNum = towerState?.current_floor || 1;
  const progress = currentFloor?.progress || 0;
  const balance = wallet?.balance || 0;
  const biome = getBiome(currentFloorNum);
  const remaining = 100 - progress;
  const actualAmount = Math.min(selectedAmount, remaining);

  const handleBuild = async () => {
    if (!profile) return;

    if (balance < actualAmount) {
      Alert.alert('Monedas insuficientes', 'Visita la tienda para comprar más monedas.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a tienda', onPress: () => router.replace('/(tabs)/shop') },
      ]);
      return;
    }

    setBuilding(true);

    const result = await contributeToFloor(profile.id, actualAmount);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo construir');
      setBuilding(false);
      return;
    }

    // Success feedback
    if (result.floor_completed) {
      const animMsg = result.animation_level !== 'standard'
        ? `\n\n🎆 ¡Hito ${result.animation_level}!`
        : '';
      const tierMsg = result.tier_upgraded
        ? `\n\n⬆️ ¡Subiste al tier ${result.new_tier}!`
        : '';

      Alert.alert(
        '🎉 ¡Piso completado!',
        `El piso ${formatFloorNumber(currentFloorNum)} ha sido completado.${animMsg}${tierMsg}`,
        [{ text: '🏗️ Seguir construyendo' }]
      );
    } else {
      // Quick feedback for contribution without completing
      Alert.alert(
        '✅ ¡Contribución exitosa!',
        `Aportaste ${actualAmount} monedas al piso ${formatFloorNumber(currentFloorNum)}.\nBalance: ${result.new_balance} 🪙`,
        [{ text: 'OK' }]
      );
    }

    setBuilding(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Volver a la torre</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Current floor info */}
        <View style={styles.floorInfo}>
          <Text style={styles.biomeLabel}>{biome.emoji} {biome.name}</Text>
          <Text style={styles.floorLabel}>CONSTRUYENDO</Text>
          <Text style={styles.floorNumber}>
            Piso #{formatFloorNumber(currentFloorNum)}
          </Text>
          <View style={styles.progressSection}>
            <ProgressBar progress={progress} height={10} showLabel />
          </View>
          <Text style={styles.progressDetail}>
            {progress}/100 monedas · {remaining} restantes
          </Text>
        </View>

        {/* Amount selector */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>CANTIDAD A CONTRIBUIR</Text>
          <View style={styles.amountButtons}>
            {AMOUNTS.map((amount) => {
              const effective = Math.min(amount, remaining);
              const canAfford = balance >= effective;
              const isSelected = selectedAmount === amount;

              return (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.amountBtn,
                    isSelected && styles.amountBtnActive,
                    !canAfford && styles.amountBtnDisabled,
                  ]}
                  onPress={() => setSelectedAmount(amount)}
                  disabled={!canAfford}
                >
                  <Text style={[styles.amountValue, isSelected && styles.amountValueActive]}>
                    {effective}
                  </Text>
                  <Text style={styles.amountLabel}>🪙</Text>
                  {amount !== effective && (
                    <Text style={styles.amountCapped}>máx</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contribución</Text>
            <Text style={styles.summaryValue}>{actualAmount} 🪙</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tu balance actual</Text>
            <CoinDisplay amount={balance} size="sm" />
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Balance después</Text>
            <Text style={[styles.summaryValue, { color: COLORS.accentGreen }]}>
              {Math.max(0, balance - actualAmount)} 🪙
            </Text>
          </View>
          <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 4 }]}>
            <Text style={styles.summaryLabel}>Progreso del piso</Text>
            <Text style={[styles.summaryValue, { color: COLORS.accentCyan }]}>
              {progress}% → {Math.min(100, progress + actualAmount)}%
            </Text>
          </View>
          {progress + actualAmount >= 100 && (
            <Text style={styles.completionAlert}>
              🎉 ¡Este piso se completará con tu contribución!
            </Text>
          )}
        </View>

        {/* Build button */}
        <View style={styles.buildSection}>
          <Button
            title={building ? 'CONSTRUYENDO...' : `⚡ CONSTRUIR (${actualAmount} 🪙)`}
            onPress={handleBuild}
            variant="primary"
            size="lg"
            loading={building}
            disabled={balance < 1 || actualAmount <= 0 || remaining <= 0}
            style={{ width: '100%' }}
          />

          {balance < 50 && (
            <TouchableOpacity onPress={() => router.replace('/(tabs)/shop')}>
              <Text style={styles.insufficientText}>
                No tienes suficientes monedas.{' '}
                <Text style={styles.shopLink}>Ir a la tienda →</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  backBtn: { padding: 16 },
  backText: { fontSize: 14, color: COLORS.textSecondary },
  content: { flex: 1, padding: 24, gap: 24 },
  floorInfo: { alignItems: 'center', gap: 6 },
  biomeLabel: { fontSize: 12, color: COLORS.textDim },
  floorLabel: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 3,
  },
  floorNumber: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 32, fontWeight: '900', color: COLORS.accentCyan,
  },
  progressSection: { width: '100%', marginTop: 8 },
  progressDetail: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  amountSection: { gap: 12 },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 3,
  },
  amountButtons: { flexDirection: 'row', gap: 12 },
  amountBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20,
    backgroundColor: COLORS.bgCard, borderWidth: 2, borderColor: COLORS.border, borderRadius: 14, gap: 4,
  },
  amountBtnActive: {
    borderColor: COLORS.accentCyan, backgroundColor: 'rgba(0, 206, 201, 0.08)',
    shadowColor: COLORS.accentCyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 12,
  },
  amountBtnDisabled: { opacity: 0.3 },
  amountValue: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 24, fontWeight: '800', color: COLORS.textSecondary,
  },
  amountValueActive: { color: COLORS.accentCyan },
  amountLabel: { fontSize: 16 },
  amountCapped: { fontSize: 9, color: COLORS.accentGold, fontWeight: '700' },
  summaryCard: {
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, padding: 16, gap: 10,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: COLORS.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  completionAlert: {
    textAlign: 'center', fontSize: 13, fontWeight: '700', color: COLORS.accentGold,
    marginTop: 8, padding: 8, backgroundColor: 'rgba(240,192,64,0.08)', borderRadius: 8,
  },
  buildSection: { marginTop: 'auto', gap: 12, alignItems: 'center' },
  insufficientText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
  shopLink: { color: COLORS.accentGold, fontWeight: '700' },
});
