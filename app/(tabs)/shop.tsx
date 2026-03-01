// ═══════════════════════════════════════
// Shop Screen — Coin packages + Stripe
// ═══════════════════════════════════════

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, COIN_PACKAGES } from '@/constants/game';
import { useWalletStore, useAuthStore } from '@/lib/store';
import { creditTestCoins } from '@/lib/payments';
import { CoinDisplay, Card, Button } from '@/components/ui';
import type { CoinPackage } from '@/types';

// Set to true to enable free test coins (disable in production!)
const DEV_MODE = !process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY === 'pk_test_placeholder';

export default function ShopScreen() {
  const { wallet, fetchWallet } = useWalletStore();
  const { profile } = useAuthStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handleBuyPackage = async (pkg: CoinPackage) => {
    if (!profile) return;

    if (DEV_MODE) {
      // DEV: Credit coins directly for testing
      Alert.alert(
        '🧪 Modo Desarrollo',
        `¿Agregar ${pkg.coins.toLocaleString()} monedas gratis? (Stripe no configurado)`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Agregar gratis',
            onPress: async () => {
              setPurchasing(pkg.id);
              const result = await creditTestCoins(profile.id, pkg.coins);
              if (result.success) {
                await fetchWallet(profile.id);
                Alert.alert('✅ ¡Listo!', `Se agregaron ${pkg.coins.toLocaleString()} monedas. Balance: ${result.newBalance?.toLocaleString()}`);
              } else {
                Alert.alert('Error', result.error || 'No se pudieron agregar monedas');
              }
              setPurchasing(null);
            },
          },
        ]
      );
    } else {
      // PRODUCTION: Use Stripe
      Alert.alert(
        'Comprar monedas',
        `¿Comprar ${pkg.coins.toLocaleString()} monedas por $${pkg.price} USD?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: `Pagar $${pkg.price}`,
            onPress: async () => {
              setPurchasing(pkg.id);
              // TODO: Implement Stripe Payment Sheet
              // 1. Call createPaymentIntent()
              // 2. Open Stripe Payment Sheet
              // 3. On success, call confirmPayment()
              // 4. Refresh wallet
              Alert.alert('Stripe', 'Integración de Stripe Payment Sheet pendiente');
              setPurchasing(null);
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>🪙 TIENDA</Text>

        {DEV_MODE && (
          <View style={styles.devBanner}>
            <Text style={styles.devBannerText}>🧪 MODO DESARROLLO — Monedas gratis</Text>
          </View>
        )}

        {/* Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceEmoji}>🪙</Text>
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
              disabled={purchasing === pkg.id}
            >
              {pkg.popular && (
                <View style={styles.popularTag}>
                  <Text style={styles.popularTagText}>⭐ POPULAR</Text>
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
              <View style={styles.packagePriceBox}>
                {purchasing === pkg.id ? (
                  <Text style={styles.packagePrice}>...</Text>
                ) : DEV_MODE ? (
                  <Text style={[styles.packagePrice, { color: COLORS.accentGreen }]}>GRATIS</Text>
                ) : (
                  <Text style={styles.packagePrice}>${pkg.price}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick add for dev */}
        {DEV_MODE && (
          <View style={{ marginTop: 24, gap: 10 }}>
            <Text style={styles.sectionTitle}>🧪 DESARROLLO RÁPIDO</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[100, 500, 1000].map((amount) => (
                <Button
                  key={amount}
                  title={`+${amount}`}
                  variant="secondary"
                  size="sm"
                  onPress={async () => {
                    if (!profile) return;
                    const result = await creditTestCoins(profile.id, amount);
                    if (result.success) await fetchWallet(profile.id);
                  }}
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDeep },
  scroll: { padding: 16, paddingBottom: 32 },
  title: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', letterSpacing: 3, marginBottom: 12,
  },
  devBanner: {
    backgroundColor: 'rgba(240,192,64,0.1)', borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)',
    borderRadius: 8, padding: 10, alignItems: 'center', marginBottom: 12,
  },
  devBannerText: { fontSize: 12, fontWeight: '700', color: COLORS.accentGold },
  balanceCard: {
    alignItems: 'center', padding: 24,
    backgroundColor: 'rgba(240, 192, 64, 0.06)', borderWidth: 1, borderColor: 'rgba(240, 192, 64, 0.12)',
    borderRadius: 14, marginBottom: 24,
  },
  balanceEmoji: { fontSize: 32, marginBottom: 8 },
  balanceAmount: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 40, fontWeight: '900', color: COLORS.accentGold,
  },
  balanceLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 11, fontWeight: '700', color: COLORS.textDim, letterSpacing: 3, marginBottom: 12,
  },
  packages: { gap: 10 },
  packageCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, position: 'relative',
  },
  packagePopular: { borderColor: 'rgba(240, 192, 64, 0.3)', backgroundColor: 'rgba(240, 192, 64, 0.04)' },
  popularTag: {
    position: 'absolute', top: -9, right: 12,
    backgroundColor: COLORS.accentGold, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 50,
  },
  popularTagText: { fontSize: 9, fontWeight: '800', color: '#000', letterSpacing: 1 },
  packageEmoji: { fontSize: 28, marginRight: 14 },
  packageInfo: { flex: 1 },
  packageCoins: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  packageFloors: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  packageBonus: { fontSize: 11, color: COLORS.accentGreen, fontWeight: '700', marginTop: 2 },
  packagePriceBox: { minWidth: 60, alignItems: 'flex-end' },
  packagePrice: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 18, fontWeight: '800', color: COLORS.accentCyan,
  },
});
