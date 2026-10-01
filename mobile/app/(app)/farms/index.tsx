import { Link, router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../components';
import { farmStatusMeta, formatLandArea } from '../../../lib/farm';
import { colors, spacing } from '../../../lib/theme';
import { listFarms } from '../../../services/farms';
import { useAuth } from '../../../store/auth';
import type { Farm } from '../../../types/farm';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; farms: Farm[] };

export default function FarmsScreen() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const { token } = useAuth();

  const load = useCallback(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Token tidak tersedia' });
      return;
    }

    setState({ kind: 'loading' });

    listFarms(token)
      .then((farms) => setState({ kind: 'success', farms }))
      .catch((error: unknown) =>
        setState({
          kind: 'error',
          message:
            error instanceof Error ? error.message : 'Gagal memuat lahan',
        }),
      );
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text variant="h1" color={colors.brand.forest700}>
          Lahan Saya
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Kelola lahan dan status karbon Anda
        </Text>
      </View>

      {state.kind === 'loading' ? (
        <View style={styles.list}>
          <Skeleton height={96} borderRadius={16} />
          <Skeleton height={96} borderRadius={16} />
        </View>
      ) : null}

      {state.kind === 'error' ? (
        <ErrorState
          message={state.message}
          onRetry={load}
        />
      ) : null}

      {state.kind === 'success' && state.farms.length === 0 ? (
        <EmptyState
          title="Belum ada lahan"
          description="Daftarkan lahan pertama Anda untuk memulai penilaian karbon."
          actionLabel="Daftarkan Lahan"
          onAction={() => router.push('/farms/new')}
        />
      ) : null}

      {state.kind === 'success' && state.farms.length > 0 ? (
        <View style={styles.list}>
          {state.farms.map((farm) => (
            <Link key={farm.id} href={`/farms/${farm.id}`} asChild>
              <Pressable>
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardTitle}>
                      <Text variant="h3" color={colors.neutral.ink900}>
                        {farm.name}
                      </Text>
                      <Text variant="caption" color={colors.neutral.ink500}>
                        {farm.digitalFarmId}
                      </Text>
                    </View>
                    <StatusBadge
                      label={farmStatusMeta(farm.status).label}
                      tone={farmStatusMeta(farm.status).tone}
                    />
                  </View>
                  <View style={styles.cardMeta}>
                    <Text variant="body" color={colors.neutral.ink700}>
                      {farm.commodity}
                    </Text>
                    <Text variant="caption" color={colors.neutral.ink500}>
                      {formatLandArea(farm.landAreaHa)}
                    </Text>
                  </View>
                </Card>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      <Button
        label="Daftarkan Lahan"
        icon={Plus}
        onPress={() => router.push('/farms/new')}
        style={styles.add}
      />
    </Screen>
  );
}

const styles = {
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  card: {
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    gap: spacing.xs,
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  add: {
    marginTop: 'auto',
  },
} as const;
