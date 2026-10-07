import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Plus,
} from 'lucide-react-native';
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
import {
  canAggregate,
  criterionLabel,
  failedCriteria,
  formatArea,
  formatProjectDate,
  nextProjectStatus,
  projectStatusMeta,
} from '../../../lib/carbon-project';
import { colors, spacing } from '../../../lib/theme';
import {
  aggregateProject,
  changeProjectStatus,
  getEligibleFarms,
  listAdminProjects,
} from '../../../services/carbon-project';
import { useAuth } from '../../../store/auth';
import type {
  EligibleFarmFilter,
  ProjectSummary,
} from '../../../types/carbon-project';

export default function AdminProjectsScreen() {
  const { token, user } = useAuth();

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [filter, setFilter] = useState<EligibleFarmFilter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [projectList, eligible] = await Promise.all([
        listAdminProjects(token),
        getEligibleFarms(token),
      ]);
      setProjects(projectList);
      setFilter(eligible);
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

  const handleAggregate = async (project: ProjectSummary) => {
    if (!token) return;
    setBusyId(project.id);
    setActionError(null);
    setNotice(null);
    try {
      const result = await aggregateProject(project.id, token);
      setNotice(
        `${result.total_farms} lahan teragregasi, total ${formatArea(result.total_area_ha)}. ${result.provisional_notice}`,
      );
      await load();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menjalankan agregasi.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleTransition = async (project: ProjectSummary) => {
    if (!token) return;
    const next = nextProjectStatus(project.status);
    if (next == null) return;

    setBusyId(project.id);
    setActionError(null);
    setNotice(null);
    try {
      await changeProjectStatus(project.id, next, token);
      await load();
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal mengubah status proyek.',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Screen>
        <EmptyState
          icon={AlertTriangle}
          title="Akses khusus admin"
          description="Halaman ini hanya untuk admin yang mengelola proyek karbon."
          actionLabel="Kembali"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const nextStatus = nextProjectStatus;
  const eligibleCount = filter?.min_eligible_now ?? 0;
  const minRequired = filter?.min_required ?? 0;
  const canRunAggregation = filter != null && eligibleCount >= minRequired;

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
          Buat proyek, jalankan filter kelayakan, dan atur tahapnya.
        </Text>
      </View>

      <Button
        label="Buat Proyek Baru"
        onPress={() => router.push('/admin/projects/new')}
      />

      {filter != null ? (
        <Pressable onPress={() => setShowFilter((prev) => !prev)}>
          <Card style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Filter size={16} color={colors.brand.forest600} />
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                Filter Kelayakan
              </Text>
              <View style={styles.spacer} />
              <Text
                variant="bodyMedium"
                color={
                  canRunAggregation
                    ? colors.brand.forest600
                    : colors.semantic.warning
                }
              >
                {eligibleCount} / {minRequired} lahan
              </Text>
              {showFilter ? (
                <ChevronUp size={16} color={colors.neutral.ink500} />
              ) : (
                <ChevronDown size={16} color={colors.neutral.ink500} />
              )}
            </View>

            {!canRunAggregation ? (
              <Text variant="caption" color={colors.semantic.warning}>
                Agregasi butuh minimal {minRequired} lahan eligible. Saat ini{' '}
                {eligibleCount}.
              </Text>
            ) : (
              <Text variant="caption" color={colors.neutral.ink500}>
                {eligibleCount} lahan memenuhi seluruh gerbang.
              </Text>
            )}

            {showFilter ? (
              <View style={styles.filterDetail}>
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  Eligible ({filter.eligible.length})
                </Text>
                {filter.eligible.length === 0 ? (
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Belum ada lahan yang lolos.
                  </Text>
                ) : (
                  filter.eligible.map((farm) => (
                    <Text
                      key={farm.farm_id}
                      variant="caption"
                      color={colors.neutral.ink700}
                    >
                      {farm.farm_id.slice(0, 8)} ·{' '}
                      {formatArea(farm.land_area_ha)}
                    </Text>
                  ))
                )}

                <Text
                  variant="bodyMedium"
                  color={colors.neutral.ink900}
                  style={styles.filterSubhead}
                >
                  Belum lolos ({filter.rejected.length})
                </Text>
                {filter.rejected.length === 0 ? (
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Semua lahan lolos.
                  </Text>
                ) : (
                  filter.rejected.map((farm) => (
                    <View key={farm.farm_id} style={styles.rejectedRow}>
                      <Text
                        variant="caption"
                        color={colors.neutral.ink700}
                      >
                        {farm.farm_id.slice(0, 8)} ·{' '}
                        {formatArea(farm.land_area_ha)}
                      </Text>
                      {failedCriteria(farm).map((criterion) => (
                        <Text
                          key={criterion.key}
                          variant="caption"
                          color={colors.neutral.ink500}
                        >
                          - {criterionLabel(criterion.key)}:{' '}
                          {criterion.reason}
                        </Text>
                      ))}
                    </View>
                  ))
                )}

                <Text
                  variant="caption"
                  color={colors.semantic.warning}
                  style={styles.filterSubhead}
                >
                  Tidak dinilai:{' '}
                  {filter.not_assessed
                    .map((entry) => entry.component)
                    .join(', ')}
                </Text>
              </View>
            ) : null}
          </Card>
        </Pressable>
      ) : null}

      {error != null ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {actionError != null ? (
        <Card style={styles.actionError}>
          <Text variant="caption" color={colors.semantic.error}>
            {actionError}
          </Text>
        </Card>
      ) : null}

      {notice != null ? (
        <Card style={styles.notice}>
          <Text variant="caption" color={colors.neutral.ink700}>
            {notice}
          </Text>
        </Card>
      ) : null}

      {projects == null && error == null ? (
        <View style={styles.list}>
          <Skeleton height={160} borderRadius={16} />
          <Skeleton height={160} borderRadius={16} />
        </View>
      ) : null}

      {projects != null && projects.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Belum ada proyek"
          description="Buat proyek karbon kandidat untuk memulai."
          actionLabel="Buat Proyek Baru"
          onAction={() => router.push('/admin/projects/new')}
        />
      ) : null}

      <View style={styles.list}>
        {projects?.map((project) => {
          const busy = busyId === project.id;
          const status = projectStatusMeta(project.status);
          const upcoming = nextStatus(project.status);
          const aggregateAllowed =
            canAggregate(project.status) && canRunAggregation;

          return (
            <Card key={project.id} style={styles.card}>
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
                <Text variant="caption" color={colors.neutral.ink700}>
                  {project.total_farms} lahan ·{' '}
                  {formatArea(project.total_area_ha)}
                </Text>
                <Text variant="caption" color={colors.neutral.ink500}>
                  {formatProjectDate(project.created_at)}
                </Text>
              </View>

              <View style={styles.cardActions}>
                {upcoming != null ? (
                  <Button
                    label={`Ke ${projectStatusMeta(upcoming).label}`}
                    variant="secondary"
                    onPress={() => void handleTransition(project)}
                    loading={busy}
                    disabled={busy}
                    style={styles.flexButton}
                  />
                ) : (
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Tahap akhir MVP tercapai
                  </Text>
                )}
              </View>

              <Button
                label="Jalankan Agregasi"
                onPress={() => void handleAggregate(project)}
                loading={busy}
                disabled={busy || !aggregateAllowed}
              />

              {!aggregateAllowed && canAggregate(project.status) ? (
                <Text variant="caption" color={colors.semantic.warning}>
                  Disabled: butuh minimal {minRequired} lahan eligible.
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>

      {projects != null && projects.length > 0 ? (
        <Card style={styles.legend}>
          <Text variant="caption" color={colors.neutral.ink500}>
            Proyek berhenti di tahap AGGREGATING. Registrasi, issuance, dan
            trading tidak tersedia di MVP.
          </Text>
        </Card>
      ) : null}

      {projects != null && projects.length > 0 ? (
        <Pressable
          onPress={() => router.push('/admin/review')}
          style={styles.crossLink}
        >
          <Plus size={16} color={colors.brand.forest600} />
          <Text variant="caption" color={colors.brand.forest600}>
            Verifikasi data lahan sebelum menghitung kelayakan
          </Text>
        </Pressable>
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
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  filterCard: {
    gap: spacing.xs,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  spacer: {
    flex: 1,
  },
  filterDetail: {
    gap: spacing.xs,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EDEFF0',
    paddingTop: spacing.sm,
  },
  filterSubhead: {
    marginTop: spacing.sm,
  },
  rejectedRow: {
    gap: 2,
  },
  actionError: {
    marginBottom: spacing.md,
  },
  notice: {
    marginBottom: spacing.md,
  },
  legend: {
    marginTop: spacing.lg,
  },
  crossLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});