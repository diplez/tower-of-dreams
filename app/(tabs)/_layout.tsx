// ═══════════════════════════════════════
// Tabs Layout — Bottom Navigation
// ═══════════════════════════════════════

export const unstable_settings = {
  initialRouteName: 'tower',
};

import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/game';
import { useAuthStore, useTowerStore, useWalletStore } from '@/lib/store';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { profile } = useAuthStore();
  const { fetchTowerState, fetchCurrentFloor, subscribeToRealtime } = useTowerStore();
  const { fetchWallet, subscribeToWallet } = useWalletStore();

  useEffect(() => {
    // Load initial data when tabs mount
    const init = async () => {
      await fetchTowerState();
      await fetchCurrentFloor();
      if (profile?.id) {
        await fetchWallet(profile.id);
        subscribeToWallet(profile.id);
      }
      subscribeToRealtime();
    };
    init();

    return () => {
      useTowerStore.getState().unsubscribe();
    };
  }, [profile?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.accentGlow,
        tabBarInactiveTintColor: COLORS.textDim,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="tower"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏗️" label="Torre" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🪙" label="Tienda" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏆" label="Ranking" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="Chat" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bgSurface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 85 : 70,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    opacity: 0.5,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDim,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: COLORS.accentGlow,
  },
});
