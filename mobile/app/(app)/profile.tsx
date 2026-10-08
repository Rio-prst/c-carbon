import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { CircleCheck, CircleSlash, UserRound } from 'lucide-react-native';
import {
  Button,
  Card,
  ErrorState,
  Screen,
  Skeleton,
  StatusBadge,
  Text,
} from '../../components';
import { formatConsentDate, purposeLabel } from '../../lib/consent';
import { colors, spacing } from '../../lib/theme';
import { getConsents, revokeConsent } from '../../services/consent';
import { useAuth } from '../../store/auth';
import type { ConsentStatus } from '../../types/consent';

export default function ProfileScreen() {
  const { token, user } = useAuth();

  const [status, setStatus] = useState<ConsentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setStatus(await getConsents(token));
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat persetujuan. Coba lagi.',
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

  const onRevoke = async () => {
    if (!token) return;
    setBusy(true);
    setActionError(null);
    try {
      // The server returns the full history, so the revoked row stays visible
      // with its timestamp rather than disappearing from the list.
      setStatus(await revokeConsent('carbon_project', token));
    } catch (err: unknown) {
      setActionError(
        err instanceof Error
          ? err.message
          : 'Gagal menarik persetujuan.',
      );
    } finally {
      setBusy(false);
    }
  };

  const canRevoke = status?.carbon_project_granted === true;
  const isFarmer = user?.role === 'FARMER';

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
          Profil
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Data akun dan pengelolaan persetujuan penggunaan data.
        </Text>
      </View>

      <Card style={styles.profile}>
        <View style={styles.profileHeader}>
          <UserRound size={18} color={colors.brand.forest600} />
          <View style={styles.profileText}>
            <Text variant="h3" color={colors.neutral.ink900}>
              {user?.name ?? '-'}
            </Text>
            <Text variant="caption" color={colors.neutral.ink500}>
              {user?.email ?? '-'}
            </Text>
          </View>
          <StatusBadge
            label={user?.role ?? '-'}
            tone={user?.role === 'ADMIN' ? 'warning' : 'neutral'}
          />
        </View>
      </Card>

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

      {status == null && error == null ? (
        <View style={styles.skeletonGroup}>
          <Skeleton height={90} borderRadius={16} />
          <Skeleton height={140} borderRadius={16} />
        </View>
      ) : null}

      {status != null && isFarmer ? (
        <View style={styles.consentSection}>
          <Card
            style={[
              styles.statusCard,
              status.carbon_project_granted
                ? styles.statusGranted
                : styles.statusRevoked,
            ]}
          >
            <View style={styles.statusHeader}>
              {status.carbon_project_granted ? (
                <CircleCheck size={18} color={colors.brand.forest600} />
              ) : (
                <CircleSlash size={18} color={colors.semantic.warning} />
              )}
              <Text
                variant="bodyMedium"
                color={
                  status.carbon_project_granted
                    ? colors.brand.forest700
                    : colors.semantic.warning
                }
              >
                {status.carbon_project_granted
                  ? 'Persetujuan aktif'
                  : 'Persetujuan ditarik'}
              </Text>
            </View>
            <Text variant="caption" color={colors.neutral.ink700}>
              {status.notice}
            </Text>
          </Card>

          <Card style={styles.historyCard}>
            <Text variant="bodyMedium" color={colors.neutral.ink900}>
              Riwayat persetujuan
            </Text>
            {status.consents.length === 0 ? (
              <Text variant="caption" color={colors.neutral.ink500}>
                Belum ada persetujuan tercatat.
              </Text>
            ) : (
              status.consents.map((consent, index) => (
                <View
                  key={`${consent.purpose}-${consent.granted_at}-${index}`}
                  style={[
                    styles.historyRow,
                    index > 0 ? styles.historyDivider : null,
                  ]}
                >
                  <View style={styles.historyTop}>
                    <Text
                      variant="body"
                      color={colors.neutral.ink900}
                      style={styles.historyTitle}
                    >
                      {purposeLabel(consent.purpose)}
                    </Text>
                    <StatusBadge
                      label={consent.active ? 'Aktif' : 'Ditarik'}
                      tone={consent.active ? 'success' : 'warning'}
                    />
                  </View>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Versi {consent.consent_version} · diberikan{' '}
                    {formatConsentDate(consent.granted_at)}
                  </Text>
                  {consent.revoked_at != null ? (
                    <Text variant="caption" color={colors.neutral.ink500}>
                      Ditarik {formatConsentDate(consent.revoked_at)}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </Card>

          <Button
            label="Tarik Persetujuan"
            variant="destructive"
            onPress={() => void onRevoke()}
            loading={busy}
            disabled={busy || !canRevoke}
          />
          {!canRevoke ? (
            <Text variant="caption" color={colors.neutral.ink500}>
              Tidak ada persetujuan aktif untuk ditarik.
            </Text>
          ) : null}
        </View>
      ) : null}

      {status != null && !isFarmer ? (
        <Card style={styles.scopeCard}>
          <Text variant="bodyMedium" color={colors.neutral.ink900}>
            Persetujuan data
          </Text>
          <Text variant="caption" color={colors.neutral.ink500}>
            Persetujuan penggunaan data lahan hanya berlaku untuk akun petani.
            Akses korporat dan admin tidak berasal dari data petani.
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
  profile: {
    marginBottom: spacing.md,
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
  skeletonGroup: {
    gap: spacing.md,
  },
  actionError: {
    marginBottom: spacing.md,
  },
  consentSection: {
    gap: spacing.md,
  },
  statusCard: {
    gap: spacing.xs,
    borderLeftWidth: 3,
  },
  statusGranted: {
    borderLeftColor: colors.brand.forest600,
  },
  statusRevoked: {
    borderLeftColor: colors.semantic.warning,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  historyCard: {
    gap: spacing.xs,
  },
  historyRow: {
    gap: 2,
  },
  historyDivider: {
    borderTopWidth: 1,
    borderTopColor: '#EDEFF0',
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  historyTitle: {
    flex: 1,
  },
  scopeCard: {
    gap: spacing.xs,
  },
});