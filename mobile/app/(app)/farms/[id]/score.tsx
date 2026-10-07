import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AlertTriangle, ClipboardList } from 'lucide-react-native';
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
import { buildComponents, scoreBand } from '../../../../lib/score';
import { colors, radii, spacing } from '../../../../lib/theme';
import { getScore } from '../../../../services/score';
import { useAuth } from '../../../../store/auth';
import type { FarmScore } from '../../../../types/score';

type State =
  | { kind: 'loading' }
  | { kind: 'success'; score: FarmScore | null }
  | { kind: 'error'; message: string };

export default function ScoreScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setState({ kind: 'loading' });
    try {
      setState({ kind: 'success', score: await getScore(id, token) });
    } catch (error: unknown) {
      setState({
        kind: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Gagal memuat skor. Coba lagi.',
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

  const score = state.kind === 'success' ? state.score : null;

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
          Skor Ketahanan Karbon
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Skor gabungan dari 10 komponen Fulton Soil Score.
        </Text>
      </View>

      {state.kind === 'loading' ? <ScoreSkeleton /> : null}

      {state.kind === 'error' ? (
        <ErrorState message={state.message} onRetry={() => void load()} />
      ) : null}

      {state.kind === 'success' && score == null ? (
        <EmptyState
          icon={ClipboardList}
          title="Skor belum tersedia"
          description="Kirim data lahan terlebih dahulu agar skor bisa dihitung."
          actionLabel="Kirim Data"
          onAction={() => router.push(`/farms/${id}/data/new`)}
        />
      ) : null}

      {state.kind === 'success' && score != null ? (
        <View style={styles.content}>
          <Card style={styles.summary}>
            <View style={styles.summaryHeader}>
              <Text variant="h1" color={colors.brand.forest700}>
                {score.fss_value}
              </Text>
              <StatusBadge
                label={score.is_provisional ? 'Sementara' : 'Final'}
                tone={score.is_provisional ? 'warning' : 'success'}
              />
            </View>
            <Text variant="body" color={colors.neutral.ink700}>
              {scoreBand(score.fss_value)} · dari 100
            </Text>
            {score.provisional_reason != null ? (
              <View style={styles.notice}>
                <AlertTriangle
                  size={16}
                  strokeWidth={2}
                  color={colors.semantic.warning}
                />
                <Text variant="caption" color={colors.neutral.ink700}>
                  {score.provisional_reason}
                </Text>
              </View>
            ) : null}
          </Card>

          <View style={styles.section}>
            <Text variant="h3" color={colors.neutral.ink900}>
              Rincian komponen
            </Text>
            {buildComponents(score).map((component) => (
              <View key={component.key} style={styles.component}>
                <View style={styles.componentHeader}>
                  <Text variant="label" color={colors.neutral.ink700}>
                    {component.label}
                  </Text>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    {component.score}/100 · bobot {component.weightPercent}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      { width: `${component.score}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {score.reference_ranges != null ? (
            <Card style={styles.disclosure}>
              <Text variant="label" color={colors.neutral.ink700}>
                Catatan perhitungan
              </Text>
              <Text variant="caption" color={colors.neutral.ink500}>
                Skor ini memakai rentang acuan sementara dan belum
                divalidasi per komoditas.
              </Text>
              {score.reference_ranges.map((range) => (
                <Text
                  key={`${range.direction}-${range.worst}-${range.best}`}
                  variant="caption"
                  color={colors.neutral.ink500}
                >
                  {range.source} ({range.worst}–{range.best})
                </Text>
              ))}
            </Card>
          ) : null}

          <Button
            label="Lihat Riwayat Data"
            variant="secondary"
            onPress={() => router.push(`/farms/${id}/data`)}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function ScoreSkeleton() {
  return (
    <View style={styles.content}>
      <Skeleton height={128} borderRadius={16} />
      <Skeleton height={220} borderRadius={16} />
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
  notice: {
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
  disclosure: {
    gap: spacing.xs,
  },
});