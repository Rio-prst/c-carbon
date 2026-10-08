import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AlertTriangle, ClipboardCheck, Inbox, Paperclip } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../components';
import {
  evidenceNote,
  filterQueue,
  formatReviewDate,
  practiceLabel,
  type QueueFilter,
} from '../../../lib/admin';
import { colors, spacing } from '../../../lib/theme';
import {
  getReviewQueue,
  rejectFarmData,
  verifyFarmData,
} from '../../../services/admin';
import { getEvidence } from '../../../services/farm-data';
import { useAuth } from '../../../store/auth';
import type { ReviewQueueItem } from '../../../types/admin';
import type { Evidence } from '../../../types/farm-data';

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'SELF_REPORTED', label: 'Baru' },
  { value: 'REVIEW', label: 'Ditinjau' },
  { value: 'REJECTED', label: 'Ditolak' },
];

export default function AdminReviewScreen() {
  const { token, user } = useAuth();

  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<
    Record<string, Evidence[]>
  >({});
  const [loadingEvidenceFor, setLoadingEvidenceFor] = useState<string | null>(
    null,
  );

  /**
   * Fetched on demand rather than with the queue, so opening the review screen
   * does not request a signed link for every submission before anyone asks.
   * Each link is short lived, so it must be refetched rather than cached long.
   */
  const onOpenEvidence = async (item: ReviewQueueItem) => {
    if (!token) return;
    const key = item.id;
    if (expandedEvidence[key] != null) {
      setExpandedEvidence((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    setLoadingEvidenceFor(key);
    setActionError(null);
    try {
      // Admin reaches a farmer's farm through the review queue, so farmId comes
      // from the queue item rather than a route the admin navigated to.
      const files = await getEvidence(item.farmId, key, token);
      setExpandedEvidence((prev) => ({ ...prev, [key]: files }));
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal memuat bukti dukung.',
      );
    } finally {
      setLoadingEvidenceFor(null);
    }
  };

  const onOpenFile = async (file: Evidence) => {
    if (file.downloadUrl == null) {
      return;
    }
    try {
      await Linking.openURL(file.downloadUrl);
    } catch {
      setActionError('Tidak bisa membuka berkas bukti.');
    }
  };

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setItems(await getReviewQueue(token));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat antrean review. Coba lagi.',
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

  const visible = useMemo(
    () => filterQueue(items ?? [], filter),
    [items, filter],
  );

  const handleVerify = async (id: string) => {
    if (!token) return;
    setBusyId(id);
    setActionError(null);
    try {
      await verifyFarmData(id, token);
      // Verified items leave the queue, so drop it locally rather than
      // refetching the whole list.
      setItems((prev) => (prev ?? []).filter((item) => item.id !== id));
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal memverifikasi data.',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!token) return;
    if (reason.trim() === '') {
      setActionError('Alasan penolakan wajib diisi.');
      return;
    }

    setBusyId(id);
    setActionError(null);
    try {
      await rejectFarmData(id, reason.trim(), token);
      setItems((prev) => (prev ?? []).filter((item) => item.id !== id));
      setRejectingId(null);
      setReason('');
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : 'Gagal menolak data.',
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
          description="Halaman ini hanya untuk admin yang melakukan review data."
          actionLabel="Kembali"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

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
          Review Data Lahan
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Verifikasi atau tolak kiriman sebelum dipakai untuk penilaian.
        </Text>
      </View>

      <View style={styles.filters}>
        {FILTERS.map((option) => {
          const active = filter === option.value;

          return (
            <Button
              key={option.value}
              label={option.label}
              variant={active ? 'primary' : 'secondary'}
              onPress={() => setFilter(option.value)}
              style={styles.filterButton}
            />
          );
        })}
      </View>

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

      {items == null && error == null ? (
        <View style={styles.list}>
          <Skeleton height={140} borderRadius={16} />
          <Skeleton height={140} borderRadius={16} />
        </View>
      ) : null}

      {items != null && items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Antrean kosong"
          description="Semua kiriman sudah ditinjau."
        />
      ) : null}

      {visible.length === 0 && items != null && items.length > 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Tidak ada pada filter ini"
          description="Coba pilih filter lain."
        />
      ) : null}

      <View style={styles.list}>
        {visible.map((item) => {
          const busy = busyId === item.id;
          const rejecting = rejectingId === item.id;
          const note = evidenceNote(item);

          return (
            <Card key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitle}>
                  <Text variant="h3" color={colors.neutral.ink900}>
                    {item.farmName}
                  </Text>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    {item.digitalFarmId} · {item.commodity}
                  </Text>
                </View>
                <StatusBadge
                  label={
                    item.status === 'SELF_REPORTED'
                      ? 'Baru'
                      : item.status === 'REVIEW'
                        ? 'Ditinjau'
                        : 'Ditolak'
                  }
                  tone={
                    item.status === 'REJECTED'
                      ? 'error'
                      : item.status === 'REVIEW'
                        ? 'warning'
                        : 'neutral'
                  }
                />
              </View>

              <Text variant="caption" color={colors.neutral.ink500}>
                Dikirim {formatReviewDate(item.submittedAt)}
              </Text>

              <View style={styles.readings}>
                <Text variant="body" color={colors.neutral.ink700}>
                  Panen {item.yieldKg ?? '-'} kg
                </Text>
                <Text variant="body" color={colors.neutral.ink700}>
                  Air {item.waterUsage ?? '-'} m3
                </Text>
                <Text variant="body" color={colors.neutral.ink700}>
                  Pupuk {item.fertilizerUsage ?? '-'} kg
                </Text>
                <Text variant="body" color={colors.neutral.ink700}>
                  Sampah: {practiceLabel(item.wasteManagementPractice)}
                </Text>
                <Text variant="body" color={colors.neutral.ink700}>
                  Tanah: {practiceLabel(item.soilPractice)}
                </Text>
              </View>

              <Pressable
                onPress={() => void onOpenEvidence(item)}
                disabled={loadingEvidenceFor === item.id}
              >
                <View style={styles.evidence}>
                  <Paperclip
                    size={16}
                    strokeWidth={2}
                    color={
                      item.evidenceCount > 0
                        ? colors.brand.forest600
                        : colors.neutral.ink500
                    }
                  />
                  <Text
                    variant="caption"
                    color={
                      item.evidenceCount > 0
                        ? colors.brand.forest600
                        : colors.neutral.ink500
                    }
                  >
                    {loadingEvidenceFor === item.id
                      ? 'Memuat bukti...'
                      : (note ?? `${item.evidenceCount} bukti dukung - buka`)}
                  </Text>
                </View>
              </Pressable>

              {expandedEvidence[item.id] != null ? (
                <View style={styles.evidenceList}>
                  {expandedEvidence[item.id]!.length === 0 ? (
                    <Text variant="caption" color={colors.neutral.ink500}>
                      Tidak ada berkas tersimpan untuk data ini.
                    </Text>
                  ) : (
                    expandedEvidence[item.id]!.map((file) => (
                      <Pressable
                        key={file.id}
                        onPress={() => void onOpenFile(file)}
                        disabled={file.downloadUrl == null}
                      >
                        <View style={styles.evidenceRow}>
                          <Text
                            variant="caption"
                            color={
                              file.downloadUrl == null
                                ? colors.neutral.ink500
                                : colors.brand.forest600
                            }
                          >
                            {file.fileName ?? 'Bukti'}
                          </Text>
                          <Text variant="caption" color={colors.neutral.ink500}>
                            {file.downloadUrl == null
                              ? 'tidak bisa dibuka'
                              : 'buka'}
                          </Text>
                        </View>
                      </Pressable>
                    ))
                  )}
                </View>
              ) : null}

              {rejecting ? (
                <View style={styles.rejectBox}>
                  <Input
                    label="Alasan penolakan"
                    value={reason}
                    onChangeText={setReason}
                    placeholder="contoh: angka produksi tidak konsisten"
                    editable={!busy}
                  />
                  <View style={styles.rejectActions}>
                    <Button
                      label="Batal"
                      variant="secondary"
                      onPress={() => {
                        setRejectingId(null);
                        setReason('');
                      }}
                      disabled={busy}
                      style={styles.flexButton}
                    />
                    <Button
                      label="Tolak Data"
                      variant="destructive"
                      onPress={() => void handleReject(item.id)}
                      loading={busy}
                      disabled={busy}
                      style={styles.flexButton}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.cardActions}>
                  <Button
                    label="Verifikasi"
                    onPress={() => void handleVerify(item.id)}
                    loading={busy}
                    disabled={busy}
                    style={styles.flexButton}
                  />
                  <Button
                    label="Tolak"
                    variant="secondary"
                    onPress={() => {
                      setRejectingId(item.id);
                      setReason('');
                      setActionError(null);
                    }}
                    disabled={busy}
                    style={styles.flexButton}
                  />
                </View>
              )}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    minHeight: 40,
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
    gap: spacing.xs,
  },
  readings: {
    gap: spacing.xs,
  },
  evidence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  evidenceList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginLeft: spacing.lg,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  rejectBox: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionError: {
    marginBottom: spacing.md,
  },
});