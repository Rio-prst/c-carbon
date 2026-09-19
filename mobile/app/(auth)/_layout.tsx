import { Redirect, Stack } from 'expo-router';
import { Screen, Skeleton } from '../../components';
import { useAuth } from '../../store/auth';

export default function AuthLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <Screen>
        <Skeleton width="60%" height={28} style={{ marginBottom: 24 }} />
        <Skeleton height={48} style={{ marginBottom: 12 }} />
        <Skeleton height={48} />
      </Screen>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}