import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Button, Input, Screen, Text } from '../../../components';
import { colors, spacing } from '../../../lib/theme';
import { createFarm } from '../../../services/farms';
import { useAuth } from '../../../store/auth';
import type { Farm } from '../../../types/farm';

type FormState = {
  name: string;
  lat: string;
  lng: string;
  landAreaHa: string;
  commodity: string;
};

type FieldErrors = {
  name?: string;
  lat?: string;
  lng?: string;
  landAreaHa?: string;
  commodity?: string;
  form?: string;
};

const INITIAL_FORM: FormState = {
  name: '',
  lat: '',
  lng: '',
  landAreaHa: '',
  commodity: '',
};

function parseNumber(value: string): number | null {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export default function NewFarmScreen() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const { token } = useAuth();

  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const next: FieldErrors = {};

    if (!form.name.trim()) {
      next.name = 'Nama lahan wajib diisi';
    }
    if (!form.lat.trim()) {
      next.lat = 'Latitude wajib diisi';
    }
    if (!form.lng.trim()) {
      next.lng = 'Longitude wajib diisi';
    }
    if (!form.landAreaHa.trim()) {
      next.landAreaHa = 'Luas lahan wajib diisi';
    }
    if (!form.commodity.trim()) {
      next.commodity = 'Komoditas wajib diisi';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    const lat = parseNumber(form.lat);
    const lng = parseNumber(form.lng);
    const landAreaHa = parseNumber(form.landAreaHa);

    if (lat == null || lat < -90 || lat > 90) {
      setErrors({ lat: 'Latitude harus antara -90 dan 90.' });
      return;
    }
    if (lng == null || lng < -180 || lng > 180) {
      setErrors({ lng: 'Longitude harus antara -180 dan 180.' });
      return;
    }
    if (landAreaHa == null || landAreaHa <= 0) {
      setErrors({ landAreaHa: 'Luas lahan harus lebih dari 0.' });
      return;
    }

    if (!token) {
      setErrors({ form: 'Token tidak tersedia. Silakan login lagi.' });
      return;
    }

    setSubmitting(true);
    try {
      const farm = await createFarm({
        name: form.name.trim(),
        lat,
        lng,
        landAreaHa,
        commodity: form.commodity.trim(),
      }, token);
      router.replace(`/farms/${farm.id}`);
    } catch (error: unknown) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : 'Gagal mendaftarkan lahan. Coba lagi.',
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
            Daftarkan Lahan
          </Text>
          <Text variant="body" color={colors.neutral.ink500}>
            Isi informasi lahan Anda untuk memulai penilaian karbon.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nama Lahan"
            value={form.name}
            onChangeText={(value) => setField('name', value)}
            error={errors.name}
            placeholder="contoh: Sukamaju Padi"
            editable={!submitting}
          />

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Input
                label="Latitude"
                value={form.lat}
                onChangeText={(value) => setField('lat', value)}
                error={errors.lat}
                placeholder="-6.9175"
                keyboardType="decimal-pad"
                editable={!submitting}
              />
            </View>
            <View style={styles.rowItem}>
              <Input
                label="Longitude"
                value={form.lng}
                onChangeText={(value) => setField('lng', value)}
                error={errors.lng}
                placeholder="107.6191"
                keyboardType="decimal-pad"
                editable={!submitting}
              />
            </View>
          </View>

          <Input
            label="Luas Lahan (hektar)"
            value={form.landAreaHa}
            onChangeText={(value) => setField('landAreaHa', value)}
            error={errors.landAreaHa}
            placeholder="2.50"
            keyboardType="decimal-pad"
            editable={!submitting}
          />

          <Input
            label="Komoditas"
            value={form.commodity}
            onChangeText={(value) => setField('commodity', value)}
            error={errors.commodity}
            placeholder="contoh: Padi"
            editable={!submitting}
          />
        </View>

        {errors.form != null ? (
          <View style={styles.errorBox}>
            <Text variant="caption" color={colors.semantic.error}>
              {errors.form}
            </Text>
          </View>
        ) : null}

        <Button
          label="Daftarkan Lahan"
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  submit: {
    marginTop: spacing.xl,
  },
  errorBox: {
    marginTop: spacing.md,
  },
});
