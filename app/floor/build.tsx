// ═══════════════════════════════════════
// Build Screen — Contribute to floor
// ═══════════════════════════════════════

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useTowerStore, useWalletStore, useAuthStore } from '@/lib/store';
import { COLORS, formatFloorNumber, MIN_CONTRIBUTION, MAX_CONTRIBUTION } from '@/constants/game';
import { Button, ProgressBar, CoinDisplay } from '@/components/ui';

const AMOUNTS = [50, 75, 100];

export default function BuildScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { towerState, currentFloor, fetchTowerState, fetchCurrentFloor } = useTowerStore();
  const { wallet, fetchWallet } = useWalletStore();
  const [selectedAmount, setSelectedAmount] = useState(100);
  const [building, setBuilding] = useState(false);

  const currentFloorNum = towerState?.current_floor || 1;
  const progress = currentFloor?.progress || 0;
  const balance = wallet?.balance || 0;

  const handleBuild = async () => {
    if (!profile) return;

    if (balance < selectedAmount) {
      Alert.alert('Monedas insuficientes', 'Visita la tienda para comprar más monedas.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a tienda', onPress: () => router.replace('/(tabs)/shop') },
      ]);
      return;
    }

    setBuilding(true);

    try {
      const { data, error } = await supabase.rpc('contribute_to_floor', {
        p_user_id: profile.id,
        p_amount: selectedAmount,
      });

      if (error) {
        Alert.alert('Error', error.message);
        setBuilding(false);
        return;
      }

      const result = data;

      if (!result.success) {
        Alert.alert('Error', result.error || 'No se pudo construir');
        setBuilding(false);
        return;
      }

      // Refresh data
      await Promise.all([
        fetchTowerState(),
        fetchCurrentFloor(),
        fetchWallet(profile.id),
      ]);

      // Show success feedback
      if (result.floor_completed) {
        Alert.alert(
          '🎉 ¡Piso completado!',
          `El piso ${formatFloorNumber(currentFloorNum)} ha sido completado. ${
            result.animation_level !== 'standard'
              ? `\n\n¡Hito ${result.animation_level}!`
              : ''
          }${
            result.tier_upgraded
              ? `\n\n⬆️ ¡Subiste al tier ${result.new_tier}!`
              : ''
          }`,
          [{ text: '🏗️ Seguir construyendo' }]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Hubo un problema. Intenta de nuevo.');
    }

    setBuilding(false);
  };

  const maxContribution = Math.min(selectedAmount, 100 - progress);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Volver a la torre</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        {/* Current floor info */}
        <View style={styles.floorInfo}>
          <Text style={styles.floorLabel}>CONSTRUYENDO</Text>
          <Text style={styles.floorNumber}>
            Piso #{formatFloorNumber(currentFloorNum)}
          </Text>
          <View style={styles.progressSection}>
            <ProgressBar progress={progress} height={8} showLabel />
          </View>
          <Text style={styles.progressDetail}>
            {progress}/100 monedas · {100 - progress} restantes
          </Text>
        </View>

        {/* Amount selector */}
        <View style={styles.amountSection}>
          <Text style={styles.sectionTitle}>CANTIDAD A CONTRIBUIR</Text>
          <View style={styles.amountButtons}>
            {AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[
                  styles.amountBtn,
                  selectedAmount === amount && styles.amountBtnActive,
                  balance < amount && styles.amountBtnDisabled,
                ]}
                onPress={() => setSelectedAmount(amount)}
                disabled={balance < amount}
              >
                <Text
                  style={[
                    styles.amountValue,
                    selectedAmount === amount && styles.amountValueActive,
                  ]}
                >
                  {amount}
                </Text>
                <Text style={styles.amountLabel}>🪙</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Tu balance:</Text>
          <CoinDisplay amount={balance} size="md" />
        </View>

        {/* Build button */}
        <Button
          title={building ? 'CONSTRUYENDO...' : `⚡ CONSTRUIR (${maxContribution} 🪙)`}
          onPress={handleBuild}
          variant="primary"
          size="lg"
          loading={building}
          disabled={balance < MIN_CONTRIBUTION || maxContribution <= 0}
          style={styles.buildBtn}
        />

        {balance < MIN_CONTRIBUTION && (
          <TouchableOpacity onPress={() => router.replace('/(tabs)/shop')}>
            <Text style={styles.insufficientText}>
              No tienes suficientes monedas.{' '}
              <Text style={styles.shopLink}>Ir a la tienda →</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  backBtn: {
    padding: 16,
  },
  backText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 28,
  },
  floorInfo: {
    alignItems: 'center',
    gap: 8,
  },
  floorLabel: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 3,
  },
  floorNumber: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.accentCyan,
  },
  progressSection: {
    width: '100%',
    marginTop: 8,
  },
  progressDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  amountSection: {
    gap: 12,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 3,
  },
  amountButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  amountBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    gap: 4,
  },
  amountBtnActive: {
    borderColor: COLORS.accentCyan,
    backgroundColor: 'rgba(0, 206, 201, 0.08)',
    shadowColor: COLORS.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  amountBtnDisabled: {
    opacity: 0.3,
  },
  amountValue: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  amountValueActive: {
    color: COLORS.accentCyan,
  },
  amountLabel: {
    fontSize: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  buildBtn: {
    marginTop: 'auto',
  },
  insufficientText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  shopLink: {
    color: COLORS.accentGold,
    fontWeight: '700',
  },
});
