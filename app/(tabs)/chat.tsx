// ═══════════════════════════════════════
// Chat Screen — Placeholder (Phase 2)
// ═══════════════════════════════════════

import { View, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/game';
import { EmptyState } from '@/components/ui';

export default function ChatScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>💬 CHAT</Text>
      <EmptyState
        emoji="🔜"
        title="Chat global próximamente"
        subtitle="El chat se habilitará en la Fase 2. ¡Por ahora, construye pisos!"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  title: {
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 3,
    paddingTop: 16,
  },
});
