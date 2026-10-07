import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Info, Leaf, Sprout } from 'lucide-react-native';
import {
  Card,
  EmptyState,
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
import { listProjects } from '../../../services/carbon-project';
import { useAuth } from '../../../store/auth';
import type { ProjectSummary } from '../../../types/carbon-project';

export default function CarbonProjectsScreen() {
  const { token } = useAuth();

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setProjects(await listProjects(token));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat proyek karbon. Coba lagi.',
      );
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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
          Proyek Karbon
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Konteks proyek kandidat yang sedang dijalankan.
        </Text>
      </View>

      {error != null ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {projects == null && error == null ? (
        <View style={styles.list}>
          <Skeleton height={130} borderRadius={16} />
          <Skeleton height={130} borderRadius={16} />
        </View>
      ) : null}

      {projects != null && projects.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="Belum ada proyek"
          description="Belum ada proyek karbon kandidat yang tersedia saat ini."
        />
      ) : null}

      <View style={styles.list}>
        {projects?.map((project) => {
          const status = projectStatusMeta(project.status);

          return (
            <Pressable
              key={project.id}
              onPress={() => router.push(`/carbon/${project.id}`)}
            >
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitle}>
                    <Text variant="h3" color={colors.neutral.ink900}>
                      {project.name}
                    </Text>
                    <Text variant="caption" color={colors.neutral.ink500}>
                      {project.region} · {project.commodity_focus}
                    </Text>
                  </View>
                  <StatusBadge label={status.label} tone={status.tone} />
                </View>

                <View style={styles.scale}>
                  <View style={styles.scaleItem}>
                    <Leaf size={16} color={colors.brand.forest600} />
                    <Text variant="caption" color={colors.neutral.ink700}>
                      {project.total_farms} lahan
                    </Text>
                  </View>
                  <Text variant="caption" color={colors.neutral.ink700}>
                    {formatArea(project.total_area_ha)}
                  </Text>
                </View>

                <Text variant="caption" color={colors.neutral.ink500}>
                  Dibuat {formatProjectDate(project.created_at)}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {projects != null && projects.length > 0 ? (
        <Card style={styles.notice}>
          <View style={styles.noticeHeader}>
            <Info size={16} color={colors.semantic.warning} />
            <Text variant="caption" color={colors.semantic.warning}>
              Bukan kredit karbon
            </Text>
          </View>
          <Text variant="caption" color={colors.neutral.ink700}>
            {PROVISIONAL_NOTICE}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    gap: spacing.xs,
  },
  scale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  notice: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});