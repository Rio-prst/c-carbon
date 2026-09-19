import { Redirect, Stack } from 'expo-router';
import { Screen, Skeleton } from '../../components';
import { useAuth } from '../../store/auth';

export default function AppLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <Screen>
        <Skeleton width="50%" height={28} style={{ marginBottom: 24 }} />
        <Skeleton height={96} style={{ marginBottom: 12 }} />
        <Skeleton height={96} />
      </Screen>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}