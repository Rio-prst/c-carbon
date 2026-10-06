import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useCallback } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Paperclip, Trash2 } from 'lucide-react-native';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';
import {
  evidenceTypeLabel,
  toPickedEvidence,
  type PickedEvidence,
} from '../lib/evidence';
import { colors, spacing } from '../lib/theme';

type Props = {
  value: PickedEvidence[];
  onChange: (next: PickedEvidence[]) => void;
  disabled?: boolean;
};

const MAX_FILES = 5;

export function EvidencePicker({ value, onChange, disabled }: Props) {
  const addFiles = useCallback(async () => {
    const remaining = MAX_FILES - value.length;
    if (remaining <= 0) {
      Alert.alert('Batas tercapai', `Maksimal ${MAX_FILES} berkas per kiriman.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Izin diperlukan',
        'Aplikasi butuh izin galeri untuk melampirkan bukti dukung.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });

    if (result.canceled) return;

    const picked = result.assets.map((asset, index) =>
      toPickedEvidence(asset, `bukti-${value.length + index + 1}`),
    );
    onChange([...value, ...picked]);
  }, [onChange, value]);

  /**
   * expo-image-picker cannot return PDFs, so documents go through the
   * document picker and only the name and mime type are kept.
   */
  const addDocuments = useCallback(async () => {
    const remaining = MAX_FILES - value.length;
    if (remaining <= 0) {
      Alert.alert('Batas tercapai', `Maksimal ${MAX_FILES} berkas per kiriman.`);
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
    });

    if (result.canceled) return;

    const picked = result.assets.map((asset, index) => {
      const isImage = asset.mimeType?.startsWith('image/') ?? false;
      return {
        fileName: asset.name === '' ? `bukti-${value.length + index + 1}` : asset.name,
        type: isImage ? ('FIELD_PHOTO' as const) : ('OTHER' as const),
        localUri: isImage ? asset.uri : undefined,
        mimeType: asset.mimeType ?? undefined,
      };
    });
    onChange([...value, ...picked]);
  }, [onChange, value]);

  const onWebPick = useCallback(async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,application/pdf';

    input.onchange = () => {
      const files = Array.from(input.files ?? []).slice(0, MAX_FILES - value.length);
      onChange([
        ...value,
        ...files.map((file, index) => ({
          fileName: file.name === '' ? `bukti-${value.length + index + 1}` : file.name,
          type: file.type.startsWith('image/')
            ? ('FIELD_PHOTO' as const)
            : ('OTHER' as const),
          localUri: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          mimeType: file.type === '' ? undefined : file.type,
        })),
      ]);
    };

    input.click();
  }, [onChange, value]);

  const pick = Platform.OS === 'web' ? onWebPick : addFiles;

  const removeAt = (index: number) =>
    onChange(value.filter((_, position) => position !== index));

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Paperclip size={18} color={colors.brand.forest600} />
          <Text variant="h3" color={colors.neutral.ink900}>
            Bukti dukung
          </Text>
        </View>
        <Text variant="caption" color={colors.neutral.ink500}>
          Opsional, tetapi admin memerlukan bukti untuk memverifikasi data.
        </Text>
      </View>

      {value.length > 0 ? (
        <View style={styles.list}>
          {value.map((item, index) => (
            <View key={`${item.fileName}-${index}`} style={styles.item}>
              <View style={styles.itemText}>
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  {item.fileName}
                </Text>
                <Text variant="caption" color={colors.neutral.ink500}>
                  {evidenceTypeLabel(item.type)}
                </Text>
              </View>
              <Pressable
                onPress={() => removeAt(index)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={`Hapus ${item.fileName}`}
                hitSlop={8}
              >
                <Trash2
                  size={18}
                  color={colors.semantic.error}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          label="Galeri"
          variant="secondary"
          onPress={() => void pick()}
          disabled={disabled || value.length >= MAX_FILES}
          style={styles.flexButton}
        />
        <Button
          label="Dokumen"
          variant="secondary"
          onPress={() => void addDocuments()}
          disabled={disabled || value.length >= MAX_FILES}
          style={styles.flexButton}
        />
      </View>

      <Text variant="caption" color={colors.neutral.ink500}>
        Berkas dicatat sebagai bukti dengan nama dan jenisnya. Penyimpanan berkas
        belum tersedia di MVP, jadi reviewer tidak bisa membuka berkas aslinya.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemText: {
    flex: 1,
    gap: spacing.xs,
  },
});