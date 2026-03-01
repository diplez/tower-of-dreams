import { Stack } from 'expo-router';
import { COLORS } from '@/constants/game';

export default function FloorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.bgDeep },
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
  );
}
