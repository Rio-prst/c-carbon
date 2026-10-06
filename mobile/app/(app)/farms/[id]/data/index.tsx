import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { FileWarning, Paperclip, Plus, PlusCircle } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../../../components';
import {
  farmDataStatusMeta,
  formatSubmissionDate,
  summarizeFarmData,
} from '../../../../../lib/farm-data';
import { evidenceTypeLabel } from '../../../../../lib/evidence';
import { colors, spacing } from '../../../../../lib/theme';
import { getEvidence, getHistory } from '../../../../../services/farm-data';
import { useAuth } from '../../../../../store/auth';
import type { Evidence, FarmData } from '../../../../../types/farm-data';

export default function FarmDataHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [data, setData] = useState<FarmData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Evidence is fetched only when a row is opened, so the list does not fire
  // one request per submission on every load.
  const [openEvidenceId, setOpenEvidenceId] = useState<string | null>(null);
  const [evidenceByDataId, setEvidenceByDataId] = useState<
    Record<string, Evidence[]>
  >({});
  const [loadingEvidenceId, setLoadingEvidenceId] = useState<string | null>(null);

  const toggleEvidence = useCallback(
    async (farmDataId: string) => {
      if (openEvidenceId === farmDataId) {
        setOpenEvidenceId(null);
        return;
      }

      setOpenEvidenceId(farmDataId);
      if (evidenceByDataId[farmDataId] != null || !token) return;

      setLoadingEvidenceId(farmDataId);
      try {
        const result = await getEvidence(id, farmDataId, token);
        setEvidenceByDataId((prev) => ({ ...prev, [farmDataId]: result }));
      } catch {
        setEvidenceByDataId((prev) => ({ ...prev, [farmDataId]: [] }));
      } finally {
        setLoadingEvidenceId(null);
      }
    },
    [evidenceByDataId, id, openEvidenceId, token],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setData(await getHistory(id, token));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat riwayat data. Coba lagi.',
      );
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

  const rejected = useMemo(
    () => (data ?? []).filter((item) => item.status === 'REJECTED'),
    [data],
  );

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
          Riwayat Data
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Setiap kiriman ditinjau admin sebelum dipakai untuk penilaian karbon.
        </Text>
      </View>

      {error != null ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : null}

      {data == null && error == null ? <HistorySkeleton /> : null}

      {data != null && data.length === 0 ? (
        <EmptyState
          icon={FileWarning}
          title="Belum ada data"
          description="Kirim data lahan pertama Anda untuk memulai penilaian karbon."
          actionLabel="Kirim Data"
          onAction={() => router.push(`/farms/${id}/data/new`)}
        />
      ) : null}

      {data != null && data.length > 0 ? (
        <View style={styles.list}>
          {data.map((item) => {
            const meta = farmDataStatusMeta(item.status);

            return (
              <Card key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text variant="h3" color={colors.neutral.ink900}>
                    {formatSubmissionDate(item.submittedAt)}
                  </Text>
                  <StatusBadge
                    label={meta.label}
                    tone={meta.tone}
                  />
                </View>

                <Text variant="body" color={colors.neutral.ink700}>
                  {summarizeFarmData(item)}
                </Text>

                <Text variant="caption" color={colors.neutral.ink500}>
                  {meta.description}
                </Text>

                {item.status === 'REJECTED' ? (
                  <View style={styles.rejection}>
                    <Text variant="label" color={colors.semantic.error}>
                      Alasan ditolak
                    </Text>
                    <Text variant="body" color={colors.semantic.error}>
                      {item.rejectionReason ??
                        'Admin belum menuliskan alasan. Hubungi admin untuk detail.'}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={styles.evidenceToggle}
                  onPress={() => void toggleEvidence(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Lihat bukti dukung"
                >
                  <Paperclip
                    size={16}
                    strokeWidth={2}
                    color={
                      evidenceByDataId[item.id]?.length
                        ? colors.brand.forest600
                        : colors.neutral.ink500
                    }
                  />
                  <Text variant="caption" color={colors.neutral.ink500}>
                    {evidenceByDataId[item.id]?.length
                      ? `${evidenceByDataId[item.id].length} bukti terlampir`
                      : 'Lihat bukti dukung'}
                  </Text>
                </Pressable>

                {openEvidenceId === item.id ? (
                  loadingEvidenceId === item.id ? (
                    <Text variant="caption" color={colors.neutral.ink500}>
                      Memuat bukti...
                    </Text>
                  ) : (evidenceByDataId[item.id] ?? []).length === 0 ? (
                    <Text variant="caption" color={colors.neutral.ink500}>
                      Belum ada bukti terlampir. Admin memerlukan bukti untuk
                      memverifikasi data ini.
                    </Text>
                  ) : (
                    <View style={styles.evidenceList}>
                      {(evidenceByDataId[item.id] ?? []).map((file) => (
                        <View
                          key={file.id}
                          style={styles.evidenceItem}
                        >
                          <Text
                            variant="bodyMedium"
                            color={colors.neutral.ink900}
                          >
                            {file.fileName ?? 'Berkas bukti'}
                          </Text>
                          <Text
                            variant="caption"
                            color={colors.neutral.ink500}
                          >
                            {evidenceTypeLabel(file.type)} ·{' '}
                            {formatSubmissionDate(file.uploadedAt)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )
                ) : null}
              </Card>
            );
          })}
        </View>
      ) : null}

      {data != null && data.length > 0 ? (
        <View style={styles.actions}>
          {rejected.length > 0 ? (
            <Text variant="caption" color={colors.neutral.ink500}>
              {rejected.length} kiriman ditolak dan perlu dikirim ulang.
            </Text>
          ) : null}
          <Button
            label="Kirim Data Baru"
            icon={Plus}
            onPress={() => router.push(`/farms/${id}/data/new`)}
          />
          <Button
            label="Buat Musim Baru"
            variant="secondary"
            icon={PlusCircle}
            onPress={() => router.push(`/farms/${id}/data/seasons/new`)}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function HistorySkeleton() {
  return (
    <View style={styles.list}>
      <Skeleton height={112} borderRadius={16} />
      <Skeleton height={112} borderRadius={16} />
      <Skeleton height={112} borderRadius={16} />
    </View>
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
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rejection: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.semantic.error,
    backgroundColor: colors.neutral.white,
    gap: spacing.xs,
  },
  evidenceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  evidenceList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  evidenceItem: {
    gap: spacing.xs,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});