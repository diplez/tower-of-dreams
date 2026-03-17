// ═══════════════════════════════════════
// Root Layout — Auth gate + global providers
// ═══════════════════════════════════════

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/lib/store';
import { COLORS } from '@/constants/game';

export default function RootLayout() {
  const { isLoading, isAuthenticated, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inProtectedArea = segments[0] === '(tabs)' || segments[0] === 'floor';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (isAuthenticated && !inProtectedArea) {
      router.replace('/(tabs)/tower');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accentPrimary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgDeep,
  },
});
