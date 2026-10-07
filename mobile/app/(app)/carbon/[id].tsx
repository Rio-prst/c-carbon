import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AlertTriangle, Info, Leaf } from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../components';
import {
  PROVISIONAL_NOTICE,
  formatArea,
  formatProjectDate,
  projectStatusMeta,
} from '../../../lib/carbon-project';
import { colors, spacing } from '../../../lib/theme';
import { getProject } from '../../../services/carbon-project';
import { useAuth } from '../../../store/auth';
import type { ProjectSummary } from '../../../types/carbon-project';

type Stat = { label: string; value: string };

export default function CarbonProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [project, setProject] = useState<ProjectSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    try {
      setProject(await getProject(id, token));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat detail proyek. Coba lagi.',
      );
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const stats: Stat[] =
    project == null
      ? []
      : [
          { label: 'Jumlah lahan', value: `${project.total_farms}` },
          { label: 'Total luas', value: formatArea(project.total_area_ha) },
          { label: 'Fokus komoditas', value: project.commodity_focus },
          { label: 'Wilayah', value: project.region },
          { label: 'Dibuat', value: formatProjectDate(project.created_at) },
        ];

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
      {error != null ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {project == null && error == null ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={44} borderRadius={12} />
          <Skeleton height={180} borderRadius={16} />
        </View>
      ) : null}

      {project != null ? (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="h1" color={colors.brand.forest700}>
              {project.name}
            </Text>
            <StatusBadge
              label={projectStatusMeta(project.status).label}
              tone={projectStatusMeta(project.status).tone}
            />
          </View>

          <Card style={styles.statsCard}>
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={[styles.statRow, index > 0 ? styles.statDivider : null]}
              >
                <Text variant="body" color={colors.neutral.ink500}>
                  {stat.label}
                </Text>
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  {stat.value}
                </Text>
              </View>
            ))}
          </Card>

          <Card style={styles.scaleCard}>
            <View style={styles.scaleHeader}>
              <Leaf size={16} color={colors.brand.forest600} />
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                Skala agregat
              </Text>
            </View>
            <Text variant="caption" color={colors.neutral.ink500}>
              Angka di atas adalah agregat proyek. Rincian lahan dan identitas
              petani tidak ditampilkan.
            </Text>
          </Card>

          <Card style={styles.notice}>
            <View style={styles.noticeHeader}>
              <Info size={16} color={colors.semantic.warning} />
              <Text variant="bodyMedium" color={colors.semantic.warning}>
                Belum menjadi kredit karbon
              </Text>
            </View>
            <Text variant="caption" color={colors.neutral.ink700}>
              {PROVISIONAL_NOTICE}
            </Text>
          </Card>

          <Button
            label="Kembali ke daftar"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      ) : null}

      {error != null ? (
        <Button
          label="Kembali"
          variant="secondary"
          onPress={() => router.replace('/carbon/projects')}
          style={styles.fallback}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  skeletonGroup: {
    gap: spacing.md,
  },
  statsCard: {
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EDEFF0',
    paddingTop: spacing.sm,
  },
  scaleCard: {
    gap: spacing.xs,
  },
  scaleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notice: {
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  fallback: {
    marginTop: spacing.md,
  },
});