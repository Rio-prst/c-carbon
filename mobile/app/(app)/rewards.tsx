import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../components';
import {
  formatRewardDate,
  nextTierProgress,
  rewardEventMeta,
  rewardTierMeta,
} from '../../lib/reward';
import { colors, spacing } from '../../lib/theme';
import { getRewardsSummary } from '../../services/rewards';
import { useAuth } from '../../store/auth';
import type { RewardsSummary } from '../../types/reward';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; data: RewardsSummary };

export default function RewardsScreen() {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const { token } = useAuth();

  const load = useCallback(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Token tidak tersedia' });
      return;
    }

    setState({ kind: 'loading' });

    getRewardsSummary(token)
      .then((data) => setState({ kind: 'success', data }))
      .catch((error: unknown) =>
        setState({
          kind: 'error',
          message:
            error instanceof Error ? error.message : 'Gagal memuat poin',
        }),
      );
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const progress =
    state.kind === 'success'
      ? nextTierProgress(state.data.total_points)
      : null;

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text variant="h1" color={colors.brand.forest700}>
          Hadiah
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Riwayat aktivitas dan tingkat Anda
        </Text>
      </View>

      {state.kind === 'loading' ? (
        <View style={styles.list}>
          <Skeleton height={120} borderRadius={16} />
          <Skeleton height={72} borderRadius={16} />
          <Skeleton height={72} borderRadius={16} />
        </View>
      ) : null}

      {state.kind === 'error' ? (
        <ErrorState message={state.message} onRetry={load} />
      ) : null}

      {state.kind === 'success' ? (
        <View style={styles.list}>
          <Card style={styles.summary}>
            <Text variant="caption" color={colors.neutral.ink500}>
              Total poin
            </Text>
            <Text variant="h1" color={colors.brand.forest700}>
              {state.data.total_points}
            </Text>
            <StatusBadge
              label={rewardTierMeta(state.data.tier).label}
              tone={rewardTierMeta(state.data.tier).tone}
            />
            <Text variant="caption" color={colors.neutral.ink500}>
              {rewardTierMeta(state.data.tier).description}
            </Text>
            {progress?.next && progress.remaining !== null ? (
              <Text variant="caption" color={colors.neutral.ink500}>
                {progress.remaining} poin lagi ke{' '}
                {rewardTierMeta(progress.next).label}
              </Text>
            ) : null}
          </Card>

          {state.data.history.length === 0 ? (
            <EmptyState
              title="Belum ada aktivitas"
              description="Poin bertambah saat Anda mengirim data lahan dan menyelesaikan verifikasi."
            />
          ) : (
            state.data.history.map((item) => (
              <Card key={item.id} style={styles.item}>
                <View style={styles.itemTop}>
                  <Text
                    variant="bodyMedium"
                    color={colors.neutral.ink900}
                    style={styles.itemTitle}
                  >
                    {item.description ?? rewardEventMeta(item.event_type)}
                  </Text>
                  <Text variant="bodyMedium" color={colors.semantic.success}>
                    +{item.points}
                  </Text>
                </View>
                <View style={styles.itemMeta}>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    {formatRewardDate(item.created_at)}
                  </Text>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Total {item.total_points}
                  </Text>
                </View>
              </Card>
            ))
          )}
        </View>
      ) : null}
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
  },
  summary: {
    gap: spacing.xs,
  },
  item: {
    gap: spacing.xs,
  },
  itemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemTitle: {
    flex: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
} as const;