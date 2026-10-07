import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Button, Card, Input, Screen, Text } from '../../../../../../components';
import { colors, spacing } from '../../../../../../lib/theme';
import { createSeason, getSeasons } from '../../../../../../services/farm-data';
import { useAuth } from '../../../../../../store/auth';
import type { FarmSeason } from '../../../../../../types/farm-data';

type FormState = {
  seasonLabel: string;
  startDate: string;
  endDate: string;
};

type FieldErrors = Partial<Record<keyof FormState | 'form', string>>;

const INITIAL_FORM: FormState = {
  seasonLabel: '',
  startDate: '',
  endDate: '',
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Existing seasons carry a sequence number; a new one continues the count. */
function nextSequenceNumber(existing: FarmSeason[]): number {
  const highest = existing.reduce(
    (max, season) => Math.max(max, season.sequenceNumber ?? 0),
    0,
  );
  return highest + 1;
}

export default function NewSeasonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const next: FieldErrors = {};

    if (!form.seasonLabel.trim()) {
      next.seasonLabel = 'Label musim wajib diisi';
    }
    if (!DATE_PATTERN.test(form.startDate.trim())) {
      next.startDate = 'Tanggal mulai harus format YYYY-MM-DD';
    }
    if (!DATE_PATTERN.test(form.endDate.trim())) {
      next.endDate = 'Tanggal selesai harus format YYYY-MM-DD';
    }
    if (
      DATE_PATTERN.test(form.startDate.trim()) &&
      DATE_PATTERN.test(form.endDate.trim()) &&
      form.endDate.trim() <= form.startDate.trim()
    ) {
      next.endDate = 'Tanggal selesai harus setelah tanggal mulai';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    if (!token) {
      setErrors({ form: 'Token tidak tersedia. Silakan login lagi.' });
      return;
    }

    setSubmitting(true);
    try {
      const existing = await getSeasons(id, token);
      await createSeason(
        id,
        {
          seasonLabel: form.seasonLabel.trim(),
          startDate: form.startDate.trim(),
          endDate: form.endDate.trim(),
          sequenceNumber: nextSequenceNumber(existing),
        },
        token,
      );
      router.replace(`/farms/${id}/data`);
    } catch (error: unknown) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : 'Gagal membuat musim. Coba lagi.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen padded scroll keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="h1" color={colors.brand.forest700}>
            Buat Musim
          </Text>
          <Text variant="body" color={colors.neutral.ink500}>
            Data lahan dikirim per musim agar penilaian karbon dapat dibandingkan.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Label musim"
            value={form.seasonLabel}
            onChangeText={(value) => setField('seasonLabel', value)}
            error={errors.seasonLabel}
            placeholder="contoh: Musim hujan 2026"
            editable={!submitting}
          />
          <Input
            label="Tanggal mulai"
            value={form.startDate}
            onChangeText={(value) => setField('startDate', value)}
            error={errors.startDate}
            placeholder="YYYY-MM-DD"
            editable={!submitting}
          />
          <Input
            label="Tanggal selesai"
            value={form.endDate}
            onChangeText={(value) => setField('endDate', value)}
            error={errors.endDate}
            placeholder="YYYY-MM-DD"
            editable={!submitting}
          />
        </View>

        {errors.form != null ? (
          <Card style={styles.errorBox}>
            <Text variant="caption" color={colors.semantic.error}>
              {errors.form}
            </Text>
          </Card>
        ) : null}

        <Button
          label="Simpan Musim"
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting}
          style={styles.submit}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.neutral.surface,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  errorBox: {
    marginTop: spacing.md,
  },
  submit: {
    marginTop: spacing.xl,
  },
});