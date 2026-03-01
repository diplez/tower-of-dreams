import { Stack } from 'expo-router';
import { COLORS } from '@/constants/game';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bgDeep },
        animation: 'fade',
      }}
    />
  );
}
