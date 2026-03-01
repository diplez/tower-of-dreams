import { Redirect } from 'expo-router';
import { useAuthStore } from '@/lib/store';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/tower" />;
  }

  return <Redirect href="/auth/login" />;
}
