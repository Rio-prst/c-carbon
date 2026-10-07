import { Link, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import {
  ClipboardList,
  Gauge,
  MapPin,
  ShieldCheck,
  Sprout,
} from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../components';
import { colors, spacing } from '../../../lib/theme';
import { farmStatusMeta, formatCoordinate, formatLandArea } from '../../../lib/farm';
import { ApiClientError } from '../../../lib/api';
import { getFarm } from '../../../services/farms';
import { useAuth } from '../../../store/auth';
import type { Farm } from '../../../types/farm';

type DetailState =
  | { kind: 'loading' }
  | { kind: 'error'; notFound: boolean; message: string }
  | { kind: 'success'; farm: Farm };

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<DetailState>({ kind: 'loading' });
  const { token } = useAuth();

  const load = useCallback(() => {
    if (!token) {
      setState({ kind: 'error', notFound: false, message: 'Token tidak tersedia' });
      return;
    }

    setState({ kind: 'loading' });

    getFarm(id, token)
      .then((farm) => setState({ kind: 'success', farm }))
      .catch((error: unknown) =>
        setState({
          kind: 'error',
          notFound: error instanceof ApiClientError && error.statusCode === 404,
          message: error instanceof Error ? error.message : 'Gagal memuat lahan',
        }),
      );
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen padded>
      <View style={styles.header}>
        <Link href="/farms" asChild>
          <Pressable>
            <Text variant="bodyMedium" color={colors.brand.forest700}>
              Kembali
            </Text>
          </Pressable>
        </Link>
        <Text variant="h1" color={colors.brand.forest700}>
          Detail Lahan
        </Text>
      </View>

      {state.kind === 'loading' ? <DetailSkeleton /> : null}

      {state.kind === 'error' ? (
        <ErrorState
          message={
            state.notFound
              ? 'Lahan tidak ditemukan atau sudah dihapus.'
              : state.message
          }
          onRetry={load}
        />
      ) : null}

      {state.kind === 'success' ? (
        <View style={styles.detail}>
          <View style={styles.headerInfo}>
            <Text variant="h2" color={colors.neutral.ink900}>
              {state.farm.name}
            </Text>
            <Text variant="caption" color={colors.neutral.ink500}>
              {state.farm.digitalFarmId}
            </Text>
          </View>

          <Card style={styles.section}>
            <Text variant="bodyMedium" color={colors.neutral.ink700}>
              Informasi Lahan
            </Text>
            <InfoRow label="Komoditas" value={state.farm.commodity} />
            <InfoRow
              label="Luas Lahan"
              value={formatLandArea(state.farm.landAreaHa)}
            />
            <InfoRow
              label="Koordinat"
              value={`${formatCoordinate(state.farm.lat)}, ${formatCoordinate(state.farm.lng)}`}
            />
          </Card>

          <Card style={styles.section}>
            <View style={styles.statusRow}>
              <Text variant="bodyMedium" color={colors.neutral.ink700}>
                Status
              </Text>
              <StatusBadge
                label={farmStatusMeta(state.farm.status).label}
                tone={farmStatusMeta(state.farm.status).tone}
              />
            </View>
            <Text variant="caption" color={colors.neutral.ink500}>
              {farmStatusMeta(state.farm.status).description}
            </Text>
          </Card>

          <View style={styles.links}>
            <Button
              label="Asuransi"
              variant="secondary"
              icon={ShieldCheck}
              onPress={() => router.push(`/farms/${state.farm.id}/insurance`)}
            />
            <Button
              label="Data Lahan"
              variant="secondary"
              icon={ClipboardList}
              onPress={() => router.push(`/farms/${state.farm.id}/data`)}
            />
            <Button
              label="Skor Lahan"
              variant="secondary"
              icon={Gauge}
              onPress={() => router.push(`/farms/${state.farm.id}/score`)}
            />
            <Button
              label="Kesiapan Karbon"
              variant="secondary"
              icon={Sprout}
              onPress={() => router.push(`/farms/${state.farm.id}/readiness`)}
            />
          </View>

          <View style={styles.actions}>
            <Button
              label="Buka Lokasi"
              variant="secondary"
              icon={MapPin}
              onPress={() =>
                void Linking.openURL(
                  `https://www.google.com/maps?q=${state.farm.lat},${state.farm.lng}`,
                )
              }
            />
            <Button
              label="Kembali"
              variant="secondary"
              onPress={() => router.back()}
            />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="caption" color={colors.neutral.ink500}>
        {label}
      </Text>
      <Text variant="body" color={colors.neutral.ink900}>
        {value}
      </Text>
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View style={styles.skeleton}>
      <Skeleton width="60%" height={28} />
      <Skeleton height={96} borderRadius={16} />
      <Skeleton height={64} borderRadius={16} />
    </View>
  );
}

const styles = {
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  detail: {
    gap: spacing.lg,
  },
  headerInfo: {
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  links: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  skeleton: {
    gap: spacing.lg,
  },
} as const;
