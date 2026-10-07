import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import {
  AlertTriangle,
  Building2,
  Info,
  Layers,
  Sprout,
} from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  Text,
} from '../../../components';
import {
  CORPORATE_DISCLAIMER,
  overviewStats,
  statusBreakdownLabel,
} from '../../../lib/corporate';
import { colors, spacing } from '../../../lib/theme';
import { getCorporateOverview } from '../../../services/corporate';
import { useAuth } from '../../../store/auth';
import type { CorporateOverview } from '../../../types/corporate';

export default function CorporateOverviewScreen() {
  const { token, user } = useAuth();

  const [overview, setOverview] = useState<CorporateOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setOverview(await getCorporateOverview(token));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat ringkasan. Coba lagi.',
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

  const stats = overview == null ? [] : overviewStats(overview);

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
          Ringkasan
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Skala agregat proyek karbon yang tersedia untuk evaluasi.
        </Text>
      </View>

      {error != null ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {overview == null && error == null ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={90} borderRadius={16} />
          <Skeleton height={200} borderRadius={16} />
        </View>
      ) : null}

      {overview != null ? (
        <View style={styles.content}>
          <Card style={styles.profile}>
            <View style={styles.profileHeader}>
              <Building2 size={18} color={colors.brand.forest600} />
              <View style={styles.profileText}>
                <Text variant="h3" color={colors.neutral.ink900}>
                  {overview.company_name}
                </Text>
                <Text variant="caption" color={colors.neutral.ink500}>
                  {overview.industry} · {overview.region}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.statsCard}>
            {stats.map((stat, index) => (
              <View
                key={stat.label}
                style={[
                  styles.statRow,
                  index > 0 ? styles.statDivider : null,
                ]}
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

          <Card style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Layers size={16} color={colors.brand.forest600} />
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                Tahap proyek
              </Text>
            </View>
            <Text variant="caption" color={colors.neutral.ink500}>
              {statusBreakdownLabel(overview)}
            </Text>
          </Card>

          {overview.project_count > 0 ? (
            <Button
              label="Lihat Semua Proyek"
              onPress={() => router.push('/corporate/projects')}
            />
          ) : (
            <Card style={styles.noProject}>
              <View style={styles.noProjectHeader}>
                <Sprout size={16} color={colors.neutral.ink500} />
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  Belum ada proyek
                </Text>
              </View>
              <Text variant="caption" color={colors.neutral.ink500}>
                Belum ada proyek karbon kandidat yang dapat dievaluasi.
              </Text>
            </Card>
          )}

          <Card style={styles.notice}>
            <View style={styles.noticeHeader}>
              <Info size={16} color={colors.semantic.warning} />
              <Text variant="bodyMedium" color={colors.semantic.warning}>
                Bukan kredit karbon
              </Text>
            </View>
            <Text variant="caption" color={colors.neutral.ink700}>
              {overview.disclaimer || CORPORATE_DISCLAIMER}
            </Text>
            <Text variant="caption" color={colors.neutral.ink500}>
              Data bersifat agregat. Identitas petani dan rincian lahan tidak
              ditampilkan.
            </Text>
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  skeletonGroup: {
    gap: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  profile: {
    gap: spacing.xs,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
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
  breakdownCard: {
    gap: spacing.xs,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  noProject: {
    gap: spacing.xs,
  },
  noProjectHeader: {
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
});