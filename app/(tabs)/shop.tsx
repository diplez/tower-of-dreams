// ═══════════════════════════════════════
// Shop Screen — Coin packages
// ═══════════════════════════════════════

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, COIN_PACKAGES } from '@/constants/game';
import { useWalletStore } from '@/lib/store';
import { CoinDisplay, Card } from '@/components/ui';
import type { CoinPackage } from '@/types';

export default function ShopScreen() {
  const { wallet } = useWalletStore();

  const handleBuyPackage = (pkg: CoinPackage) => {
    // TODO: Integrate Stripe payment (Week 4)
    Alert.alert(
      'Comprar monedas',
      `¿Comprar ${pkg.coins.toLocaleString()} monedas por $${pkg.price} USD?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Comprar', onPress: () => Alert.alert('Próximamente', 'Pagos con Stripe se integran en la Fase 4') },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header */}
        <Text style={styles.title}>🪙 TIENDA</Text>

        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceAmount}>{(wallet?.balance || 0).toLocaleString()}</Text>
          <Text style={styles.balanceLabel}>monedas disponibles</Text>
        </View>

        {/* Coin Packages */}
        <Text style={styles.sectionTitle}>PAQUETES DE MONEDAS</Text>
        <View style={styles.packages}>
          {COIN_PACKAGES.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={[styles.packageCard, pkg.popular && styles.packagePopular]}
              onPress={() => handleBuyPackage(pkg)}
              activeOpacity={0.7}
            >
              {pkg.popular && (
                <View style={styles.popularTag}>
                  <Text style={styles.popularTagText}>POPULAR</Text>
                </View>
              )}
              <Text style={styles.packageEmoji}>{pkg.emoji}</Text>
              <View style={styles.packageInfo}>
                <Text style={styles.packageCoins}>
                  {pkg.coins.toLocaleString()} monedas
                </Text>
                <Text style={styles.packageFloors}>= {pkg.floors} pisos</Text>
                {pkg.bonus > 0 && (
                  <Text style={styles.packageBonus}>
                    +{pkg.bonus}% BONUS{pkg.bonus >= 50 ? ' 🔥' : ''}
                  </Text>
                )}
              </View>
              <Text style={styles.packagePrice}>${pkg.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cosmetics (placeholder) */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>COSMÉTICOS</Text>
        <View style={styles.packages}>
          <View style={styles.packageCard}>
            <Text style={styles.packageEmoji}>🎨</Text>
            <View style={styles.packageInfo}>
              <Text style={styles.packageCoins}>Skin de piso: Neón</Text>
              <Text style={styles.packageFloors}>Personaliza tus pisos</Text>
            </View>
            <Text style={[styles.packagePrice, { color: COLORS.accentGlow }]}>
              299 🪙
            </Text>
          </View>
          <View style={styles.packageCard}>
            <Text style={styles.packageEmoji}>✨</Text>
            <View style={styles.packageInfo}>
              <Text style={styles.packageCoins}>Efecto: Partículas</Text>
              <Text style={styles.packageFloors}>Efecto al construir</Text>
            </View>
            <Text style={[styles.packagePrice, { color: COLORS.accentGlow }]}>
              199 🪙
            </Text>
          </View>
        </View>
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
    paddingBottom: 32,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 16,
  },
  balanceCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(240, 192, 64, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(240, 192, 64, 0.12)',
    borderRadius: 14,
    marginBottom: 24,
  },
  balanceAmount: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.accentGold,
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDim,
    letterSpacing: 3,
    marginBottom: 12,
  },
  packages: {
    gap: 10,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    position: 'relative',
  },
  packagePopular: {
    borderColor: 'rgba(240, 192, 64, 0.3)',
    backgroundColor: 'rgba(240, 192, 64, 0.04)',
  },
  popularTag: {
    position: 'absolute',
    top: -9,
    right: 12,
    backgroundColor: COLORS.accentGold,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 50,
  },
  popularTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  packageEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  packageInfo: {
    flex: 1,
  },
  packageCoins: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  packageFloors: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  packageBonus: {
    fontSize: 11,
    color: COLORS.accentGreen,
    fontWeight: '700',
    marginTop: 2,
  },
  packagePrice: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.accentCyan,
  },
});
