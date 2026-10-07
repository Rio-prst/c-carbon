import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ClipboardList, Info, MinusCircle } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../../components';
import {
  READINESS_COMPONENTS,
  isComponentUnavailable,
  unavailableReason,
} from '../../../../lib/readiness';
import { colors, radii, spacing } from '../../../../lib/theme';
import { getReadiness } from '../../../../services/readiness';
import { useAuth } from '../../../../store/auth';
import type { CRSReadiness } from '../../../../types/readiness';

type State =
  | { kind: 'loading' }
  | { kind: 'success'; readiness: CRSReadiness | null }
  | { kind: 'error'; message: string };

export default function ReadinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'success', readiness: await getReadiness(id, token) });
    } catch (error: unknown) {
      setState({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Gagal memuat kesiapan karbon. Coba lagi.',
      });
    }
  }, [id, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const readiness = state.kind === 'success' ? state.readiness : null;

  return (
    <Screen
      scroll
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor={colors.brand.forest600}
        />
      }
    >
      <View style={styles.header}>
        <Text variant="h1" color={colors.brand.forest700}>
          Kesiapan Karbon
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Seberapa siap lahan ini dievaluasi sebagai kandidat proyek karbon.
        </Text>
      </View>

      {state.kind === 'loading' ? <ReadinessSkeleton /> : null}

      {state.kind === 'error' ? (
        <ErrorState message={state.message} onRetry={() => void load()} />
      ) : null}

      {state.kind === 'success' && readiness == null ? (
        <EmptyState
          icon={ClipboardList}
          title="Belum dapat dihitung"
          description="Kirim data lahan terlebih dahulu untuk melihat kesiapan karbon."
          actionLabel="Kirim Data"
          onAction={() => router.push(`/farms/${id}/data/new`)}
        />
      ) : null}

      {state.kind === 'success' && readiness != null ? (
        <View style={styles.content}>
          <Card style={styles.summary}>
            <View style={styles.summaryHeader}>
              <Text variant="h1" color={colors.brand.forest700}>
                {readiness.crs_value}
              </Text>
              <StatusBadge
                label={readiness.is_provisional ? 'Sementara' : 'Final'}
                tone={readiness.is_provisional ? 'warning' : 'success'}
              />
            </View>
            <View style={styles.disclaimer}>
              <Info
                size={16}
                strokeWidth={2}
                color={colors.neutral.ink500}
              />
              <Text variant="caption" color={colors.neutral.ink500}>
                {readiness.disclaimer}
              </Text>
            </View>
          </Card>

          <View style={styles.section}>
            <Text variant="h3" color={colors.neutral.ink900}>
              Rincian kesiapan
            </Text>
            {READINESS_COMPONENTS.map((component) => {
              const unavailable = isComponentUnavailable(
                readiness,
                component.key,
              );
              const score = readiness.breakdown[component.key] ?? 0;

              return (
                <View key={component.key} style={styles.component}>
                  <View style={styles.componentHeader}>
                    <Text variant="label" color={colors.neutral.ink700}>
                      {component.label}
                    </Text>
                    <Text variant="caption" color={colors.neutral.ink500}>
                      {unavailable
                        ? 'Belum tersedia'
                        : `${score}/100 · bobot ${component.weightPercent}%`}
                    </Text>
                  </View>
                  {unavailable ? (
                    <View style={styles.unavailable}>
                      <MinusCircle
                        size={16}
                        strokeWidth={2}
                        color={colors.neutral.ink500}
                      />
                      <Text variant="caption" color={colors.neutral.ink500}>
                        {unavailableReason(readiness, component.key) ??
                          'Belum dapat dinilai'}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.track}>
                      <View
                        style={[styles.fill, { width: `${score}%` }]}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {readiness.next_actions.length > 0 ? (
            <View style={styles.section}>
              <Text variant="h3" color={colors.neutral.ink900}>
                Yang perlu dipenuhi
              </Text>
              {readiness.next_actions.map((action) => (
                <View key={action} style={styles.action}>
                  <View style={styles.dot} />
                  <Text variant="body" color={colors.neutral.ink700}>
                    {action}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Button
            label="Lihat Skor Ketahanan"
            variant="secondary"
            onPress={() => router.push(`/farms/${id}/score`)}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function ReadinessSkeleton() {
  return (
    <View style={styles.content}>
      <Skeleton height={128} borderRadius={16} />
      <Skeleton height={240} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  content: {
    gap: spacing.lg,
  },
  summary: {
    gap: spacing.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
  component: {
    gap: spacing.xs,
  },
  componentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  unavailable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  track: {
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.neutral.line,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    backgroundColor: colors.brand.forest600,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    marginTop: 8,
    backgroundColor: colors.brand.forest600,
  },
});