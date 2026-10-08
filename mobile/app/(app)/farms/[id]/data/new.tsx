import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  EvidencePicker,
  Input,
  Screen,
  SelectField,
  Text,
} from '../../../../../components';
import type { PickedEvidence } from '../../../../../lib/evidence';
import {
  SOIL_PRACTICE_OPTIONS,
  WASTE_PRACTICE_OPTIONS,
  formatSubmissionDate,
} from '../../../../../lib/farm-data';
import { colors, spacing } from '../../../../../lib/theme';
import {
  addEvidence,
  uploadEvidenceFile,
  getSeasons,
  submitData,
} from '../../../../../services/farm-data';
import { useAuth } from '../../../../../store/auth';
import type { FarmSeason } from '../../../../../types/farm-data';

type FormState = {
  yieldKg: string;
  waterUsage: string;
  fertilizerUsage: string;
  pesticideUsage: string;
  energyUsage: string;
  wasteManagementPractice?: string;
  soilPractice?: string;
  lowCarbonPractice: boolean;
};

type FieldErrors = Partial<Record<keyof FormState | 'farmSeasonId' | 'form', string>>;

const INITIAL_FORM: FormState = {
  yieldKg: '',
  waterUsage: '',
  fertilizerUsage: '',
  pesticideUsage: '',
  energyUsage: '',
  wasteManagementPractice: undefined,
  soilPractice: undefined,
  lowCarbonPractice: false,
};

const SEASON_OPTIONS = (seasons: FarmSeason[] | null) =>
  (seasons ?? []).map((season) => ({
    value: season.id,
    label: season.seasonLabel ?? `Musim ${season.sequenceNumber ?? '-'}`,
  }));

/**
 * Uploads the bytes when a local file is available.
 *
 * Falls back to recording the name alone when the picker could not produce a
 * local uri, because that is what the older flow did and losing the attachment
 * entirely would be worse than an unopenable record. Resolves to null on success
 * or the failure message, never throws, so one bad file cannot lose the whole
 * submission.
 */
async function uploadEvidenceItem(
  farmId: string,
  farmDataId: string,
  item: PickedEvidence,
  token: string,
): Promise<string | null> {
  try {
    if (item.localUri != null && item.localUri !== '') {
      await uploadEvidenceFile(
        farmId,
        farmDataId,
        {
          uri: item.localUri,
          name: item.fileName,
          type: item.mimeType ?? 'application/octet-stream',
        },
        token,
      );
      return null;
    }

    await addEvidence(farmId, { farmDataId, type: item.type, fileName: item.fileName }, token);
    return null;
  } catch (err: unknown) {
    return err instanceof Error ? err.message : 'Gagal melampirkan bukti';
  }
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function SubmitFarmDataScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [seasons, setSeasons] = useState<FarmSeason[] | null>(null);
  const [farmSeasonId, setFarmSeasonId] = useState<string | undefined>();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [evidence, setEvidence] = useState<PickedEvidence[]>([]);

  const loadSeasons = useCallback(() => {
    if (!token) return;
    getSeasons(id, token)
      .then((result) => {
        setSeasons(result);
        setFarmSeasonId((current) => current ?? result[0]?.id);
      })
      .catch(() => setSeasons([]));
  }, [id, token]);

  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  const seasonOptions = useMemo(() => SEASON_OPTIONS(seasons), [seasons]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const next: FieldErrors = {};

    if (!farmSeasonId) {
      next.farmSeasonId = 'Pilih musim terlebih dahulu';
    }

    const numericFields: {
      key: keyof FormState;
      label: string;
      allowZero: boolean;
    }[] = [
      { key: 'yieldKg', label: 'Produksi panen', allowZero: false },
      { key: 'waterUsage', label: 'Penggunaan air', allowZero: false },
      { key: 'fertilizerUsage', label: 'Penggunaan pupuk', allowZero: true },
      { key: 'pesticideUsage', label: 'Penggunaan pestisida', allowZero: true },
      { key: 'energyUsage', label: 'Penggunaan energi', allowZero: true },
    ];

    for (const field of numericFields) {
      const parsed = parseOptionalNumber(form[field.key] as string);
      if (parsed == null) {
        next[field.key] = `${field.label} harus berupa angka`;
      } else if (parsed < 0) {
        next[field.key] = `${field.label} tidak boleh negatif`;
      } else if (!field.allowZero && parsed === 0) {
        next[field.key] = `${field.label} harus lebih dari 0`;
      }
    }

    if (!form.wasteManagementPractice) {
      next.wasteManagementPractice = 'Pengelolaan sampah wajib dipilih';
    }
    if (!form.soilPractice) {
      next.soilPractice = 'Praktik tanah wajib dipilih';
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
      const created = await submitData(
        id,
        {
          farmSeasonId: farmSeasonId as string,
          yieldKg: parseOptionalNumber(form.yieldKg) ?? undefined,
          waterUsage: parseOptionalNumber(form.waterUsage) ?? undefined,
          fertilizerUsage: parseOptionalNumber(form.fertilizerUsage) ?? undefined,
          pesticideUsage: parseOptionalNumber(form.pesticideUsage) ?? undefined,
          energyUsage: parseOptionalNumber(form.energyUsage) ?? undefined,
          wasteManagementPractice: form.wasteManagementPractice,
          soilPractice: form.soilPractice,
          lowCarbonPractice: form.lowCarbonPractice,
        },
        token,
      );

      // Evidence can only be attached once the submission exists, so a failed
      // attachment must not undo a successful submission.
      if (evidence.length > 0) {
        const failed = await Promise.all(
          evidence.map((item) =>
            uploadEvidenceItem(id, created.id, item, token),
          ),
        ).then((results) => results.filter((item): item is string => item != null));

        if (failed.length > 0) {
          Alert.alert(
            'Data terkirim, bukti belum lengkap',
            `Data lahan sudah tersimpan, tetapi ${failed.length} berkas gagal dilampirkan. Buka riwayat dan lampirkan ulang.`,
          );
        }
      }

      router.replace(`/farms/${id}/data`);
    } catch (error: unknown) {
      // The draft is intentionally kept so a transient failure loses nothing.
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : 'Gagal mengirim data. Coba lagi.',
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
            Kirim Data Lahan
          </Text>
          <Text variant="body" color={colors.neutral.ink500}>
            Data yang dikirim akan ditinjau admin sebelum dipakai untuk penilaian.
          </Text>
        </View>

        <Card style={styles.card}>
          <SelectField
            label="Musim"
            options={seasonOptions}
            value={farmSeasonId}
            onChange={setFarmSeasonId}
            error={errors.farmSeasonId}
            helper="Pilih musim yang akan dilaporkan"
            disabled={submitting || seasons === null || seasons.length === 0}
          />
          {seasons != null && seasons.length > 0 ? (
            <Text variant="caption" color={colors.neutral.ink500}>
              {formatSubmissionDate(
                seasons.find((s) => s.id === farmSeasonId)?.createdAt ?? '',
              )}
            </Text>
          ) : null}
        </Card>

        {seasons != null && seasons.length === 0 ? (
        <Card style={styles.noSeason}>
          <Text variant="body" color={colors.neutral.ink700}>
            Lahan ini belum punya musim, jadi data belum bisa dikirim.
          </Text>
          <Button
            label="Buat Musim"
            variant="secondary"
            onPress={() => router.push(`/farms/${id}/data/seasons/new`)}
          />
        </Card>
      ) : null}

      <View style={styles.form}>
          <Input
            label="Produksi panen (kg)"
            value={form.yieldKg}
            onChangeText={(value) => setField('yieldKg', value)}
            error={errors.yieldKg}
            placeholder="contoh: 4200"
            keyboardType="decimal-pad"
            editable={!submitting}
          />
          <Input
            label="Penggunaan air (m3)"
            value={form.waterUsage}
            onChangeText={(value) => setField('waterUsage', value)}
            error={errors.waterUsage}
            placeholder="contoh: 850"
            keyboardType="decimal-pad"
            editable={!submitting}
          />
          <Input
            label="Penggunaan pupuk (kg)"
            value={form.fertilizerUsage}
            onChangeText={(value) => setField('fertilizerUsage', value)}
            error={errors.fertilizerUsage}
            placeholder="contoh: 120"
            keyboardType="decimal-pad"
            editable={!submitting}
          />
          <Input
            label="Penggunaan pestisida (kg)"
            value={form.pesticideUsage}
            onChangeText={(value) => setField('pesticideUsage', value)}
            error={errors.pesticideUsage}
            placeholder="contoh: 8"
            keyboardType="decimal-pad"
            editable={!submitting}
          />
          <Input
            label="Penggunaan energi (kWh)"
            value={form.energyUsage}
            onChangeText={(value) => setField('energyUsage', value)}
            error={errors.energyUsage}
            placeholder="contoh: 250"
            keyboardType="decimal-pad"
            editable={!submitting}
          />

          <SelectField
            label="Pengelolaan sampah"
            options={WASTE_PRACTICE_OPTIONS}
            value={form.wasteManagementPractice}
            onChange={(value) => setField('wasteManagementPractice', value)}
            error={errors.wasteManagementPractice}
            disabled={submitting}
          />

          <SelectField
            label="Praktik tanah"
            options={SOIL_PRACTICE_OPTIONS}
            value={form.soilPractice}
            onChange={(value) => setField('soilPractice', value)}
            error={errors.soilPractice}
            disabled={submitting}
          />

          <SelectField
            label="Praktik rendah karbon"
            options={[
              { value: 'yes', label: 'Ya, diterapkan' },
              { value: 'no', label: 'Belum diterapkan' },
            ]}
            value={form.lowCarbonPractice ? 'yes' : 'no'}
            onChange={(value) => setField('lowCarbonPractice', value === 'yes')}
            disabled={submitting}
          />
        </View>

        <EvidencePicker value={evidence} onChange={setEvidence} disabled={submitting} />

        {errors.form != null ? (
          <Card style={styles.errorBox}>
            <Text variant="caption" color={colors.semantic.error}>
              {errors.form}
            </Text>
          </Card>
        ) : null}

        <Button
          label="Kirim Data"
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting || farmSeasonId == null}
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
  card: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  noSeason: {
    gap: spacing.md,
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