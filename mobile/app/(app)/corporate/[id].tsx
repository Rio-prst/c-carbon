import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { AlertTriangle, Info } from 'lucide-react-native';
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
import { CORPORATE_DISCLAIMER } from '../../../lib/corporate';
import {
  formatArea,
  formatProjectDate,
  projectStatusMeta,
} from '../../../lib/carbon-project';
import { colors, spacing } from '../../../lib/theme';
import { getProject } from '../../../services/carbon-project';
import { useAuth } from '../../../store/auth';
import type { ProjectSummary } from '../../../types/carbon-project';

export default function CorporateProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useAuth();

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

  if (user?.role !== 'CORPORATE') {
    return (
      <Screen>
        <EmptyState
          icon={AlertTriangle}
          title="Akses khusus korporat"
          description="Halaman ini hanya untuk pengguna korporat."
          actionLabel="Kembali"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  const status = project == null ? null : projectStatusMeta(project.status);

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
          <Skeleton height={200} borderRadius={16} />
        </View>
      ) : null}

      {project != null && status != null ? (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text variant="h1" color={colors.brand.forest700}>
              {project.name}
            </Text>
            <StatusBadge label={status.label} tone={status.tone} />
          </View>

          <Card style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text variant="body" color={colors.neutral.ink500}>
                Jumlah lahan
              </Text>
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                {project.total_farms}
              </Text>
            </View>
            <View style={styles.divider}>
              <Text variant="body" color={colors.neutral.ink500}>
                Total luas
              </Text>
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                {formatArea(project.total_area_ha)}
              </Text>
            </View>
            <View style={styles.divider}>
              <Text variant="body" color={colors.neutral.ink500}>
                Fokus komoditas
              </Text>
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                {project.commodity_focus}
              </Text>
            </View>
            <View style={styles.divider}>
              <Text variant="body" color={colors.neutral.ink500}>
                Wilayah
              </Text>
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                {project.region}
              </Text>
            </View>
            <View style={styles.divider}>
              <Text variant="body" color={colors.neutral.ink500}>
                Dibuat
              </Text>
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                {formatProjectDate(project.created_at)}
              </Text>
            </View>
          </Card>

          <Card style={styles.scopeCard}>
            <Text variant="bodyMedium" color={colors.neutral.ink900}>
              Ruang lingkup data
            </Text>
            <Text variant="caption" color={colors.neutral.ink500}>
              Yang ditampilkan adalah agregat proyek. Identitas petani, rincian
              lahan, dan data individu tidak dapat diakses dari tampilan
              korporat.
            </Text>
          </Card>

          <Card style={styles.notice}>
            <View style={styles.noticeHeader}>
              <Info size={16} color={colors.semantic.warning} />
              <Text variant="bodyMedium" color={colors.semantic.warning}>
                Proyek kandidat, bukan kredit karbon
              </Text>
            </View>
            <Text variant="caption" color={colors.neutral.ink700}>
              {CORPORATE_DISCLAIMER}
            </Text>
            <Text variant="caption" color={colors.neutral.ink500}>
              Proyek berhenti pada tahap agregasi. Registrasi, issuance, dan
              transaksi tidak tersedia di MVP.
            </Text>
          </Card>

          <Button
            label="Kembali ke daftar"
            variant="secondary"
            onPress={() => router.replace('/corporate/projects')}
          />
        </View>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#EDEFF0',
    paddingTop: spacing.sm,
  },
  scopeCard: {
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
});