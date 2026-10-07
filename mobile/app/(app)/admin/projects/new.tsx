import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  Input,
  Screen,
  Text,
} from '../../../../components';
import { colors, spacing } from '../../../../lib/theme';
import { createProject } from '../../../../services/carbon-project';
import { useAuth } from '../../../../store/auth';

type Errors = {
  name?: string;
  region?: string;
  commodityFocus?: string;
  submit?: string;
};

export default function NewCarbonProjectScreen() {
  const { token, user } = useAuth();

  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [commodityFocus, setCommodityFocus] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (): Errors => {
    const next: Errors = {};
    if (name.trim().length < 3) {
      next.name = 'Nama proyek minimal 3 karakter.';
    }
    if (region.trim().length < 2) {
      next.region = 'Wilayah wajib diisi.';
    }
    if (commodityFocus.trim().length < 2) {
      next.commodityFocus = 'Fokus komoditas wajib diisi.';
    }
    return next;
  };

  const onSubmit = async () => {
    if (!token) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await createProject(
        {
          name: name.trim(),
          region: region.trim(),
          commodityFocus: commodityFocus.trim(),
        },
        token,
      );
      router.back();
    } catch (err: unknown) {
      setErrors({
        submit:
          err instanceof Error ? err.message : 'Gagal membuat proyek karbon.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <Screen>
        <EmptyState
          icon={AlertTriangle}
          title="Akses khusus admin"
          description="Hanya admin yang dapat membuat proyek karbon."
          actionLabel="Kembali"
          onAction={() => router.replace('/')}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="h1" color={colors.brand.forest700}>
          Proyek Baru
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Proyek dimulai pada tahap kandidat dan belum memiliki lahan.
        </Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Nama proyek"
          value={name}
          onChangeText={setName}
          placeholder="contoh: Proyek Karet Pilot"
          editable={!submitting}
          error={errors.name}
        />

        <Input
          label="Wilayah"
          value={region}
          onChangeText={setRegion}
          placeholder="contoh: Jawa Barat"
          editable={!submitting}
          error={errors.region}
        />

        <Input
          label="Fokus komoditas"
          value={commodityFocus}
          onChangeText={setCommodityFocus}
          placeholder="contoh: Karet"
          editable={!submitting}
          error={errors.commodityFocus}
          helper="Hanya lahan dengan komoditas ini yang bisa digabungkan."
        />
      </View>

      {errors.submit != null ? (
        <Card style={styles.submitError}>
          <Text variant="caption" color={colors.semantic.error}>
            {errors.submit}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.notice}>
        <Text variant="caption" color={colors.neutral.ink700}>
          Membuat proyek belum menggabungkan lahan. Jalankan filter kelayakan
          dan agregasi setelah proyek dibuat.
        </Text>
      </Card>

      <Button
        label="Buat Proyek"
        onPress={() => void onSubmit()}
        loading={submitting}
        disabled={submitting}
      />
      <Button
        label="Batal"
        variant="secondary"
        onPress={() => router.back()}
        disabled={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  submitError: {
    marginBottom: spacing.md,
  },
  notice: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
});