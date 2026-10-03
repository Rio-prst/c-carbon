import { Link, useLocalSearchParams } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Card,
  EmptyState,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../../../components';
import { colors, spacing } from '../../../../lib/theme';
import { insuranceStatusMeta } from '../../../../lib/insurance';
import { getInsurance } from '../../../../services/insurance';
import { useAuth } from '../../../../store/auth';
import type { Insurance } from '../../../../types/insurance';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; insurance: Insurance | null };

export default function InsuranceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const { token } = useAuth();

  const load = useCallback(() => {
    if (!token) {
      setState({ kind: 'error', message: 'Token tidak tersedia' });
      return;
    }

    setState({ kind: 'loading' });

    getInsurance(id, token)
      .then((insurance) => setState({ kind: 'success', insurance }))
      .catch((error: unknown) =>
        setState({
          kind: 'error',
          message:
            error instanceof Error ? error.message : 'Gagal memuat status polis',
        }),
      );
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen padded>
      <View style={styles.header}>
        <Link href={`/farms/${id}`} asChild>
          <Pressable>
            <Text variant="bodyMedium" color={colors.brand.forest700}>
              Kembali
            </Text>
          </Pressable>
        </Link>
        <Text variant="h1" color={colors.brand.forest700}>
          Asuransi
        </Text>
      </View>

      {state.kind === 'loading' ? (
        <View style={styles.section}>
          <Skeleton height={120} borderRadius={16} />
        </View>
      ) : null}

      {state.kind === 'error' ? (
        <ErrorState message={state.message} onRetry={load} />
      ) : null}

      {state.kind === 'success' && state.insurance == null ? (
        <EmptyState
          icon={ShieldCheck}
          title="Belum ada data polis"
          description="Belum ada polis tercatat untuk lahan ini. Datapolis berasal dari mitra-asuransi dan tidak dikelola oleh platform ini."
        />
      ) : null}

      {state.kind === 'success' && state.insurance != null ? (
        <InsuranceDetail insurance={state.insurance} />
      ) : null}
    </Screen>
  );
}

function InsuranceDetail({ insurance }: { insurance: Insurance }) {
  const meta = insuranceStatusMeta(insurance.status);

  return (
    <View style={styles.section}>
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <Text variant="h3" color={colors.neutral.ink900}>
            {insurance.partner}
          </Text>
          <StatusBadge label={meta.label} tone={meta.tone} />
        </View>
        <Text variant="caption" color={colors.neutral.ink500}>
          Mitra-asuransi
        </Text>
      </Card>

      <Card style={[styles.card, styles.notice]}>
        <Text variant="body" color={colors.neutral.ink700}>
          {meta.notice}
        </Text>
      </Card>

      <Text variant="caption" color={colors.neutral.ink500}>
        C-Carbon hanya menampilkan informasi status polis. Penjaminan dan
        penerbitan polis dilakukan oleh mitra-asuransi.
      </Text>
    </View>
  );
}

const styles = {
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  card: {
    gap: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  notice: {
    backgroundColor: colors.neutral.surface,
  },
} as const;