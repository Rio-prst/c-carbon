import type { ImagePickerAsset } from 'expo-image-picker';

export const EVIDENCE_TYPE_OPTIONS = [
  { value: 'FIELD_PHOTO', label: 'Foto lapangan' },
  { value: 'HARVEST_REPORT', label: 'Laporan panen' },
  { value: 'INPUT_RECEIPT', label: 'Nota pembelian input' },
  { value: 'GPS_TRACE', label: 'Jejak lokasi' },
  { value: 'OTHER', label: 'Lainnya' },
] as const;

export type EvidenceTypeValue = (typeof EVIDENCE_TYPE_OPTIONS)[number]['value'];

export function evidenceTypeLabel(value?: string): string {
  if (value == null) return 'Lainnya';
  return EVIDENCE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

/**
 * A picked file.
 *
 * `localUri` points at the file on the device and is used to upload the bytes.
 * It is never sent as `url`: a `file://` uri means nothing to a reviewer on
 * another device, and the server issues its own short-lived link instead.
 */
export type PickedEvidence = {
  fileName: string;
  type: EvidenceTypeValue;
  localUri?: string;
  mimeType?: string;
};

function nameFromUri(uri: string, fallback: string): string {
  const tail = uri.split('/').pop() ?? '';
  const withoutQuery = tail.split('?')[0] ?? '';
  return withoutQuery.trim() === '' ? fallback : withoutQuery;
}

export function toPickedEvidence(
  asset: ImagePickerAsset,
  fallbackName: string,
): PickedEvidence {
  const fileName =
    asset.fileName?.trim() ??
    (asset.uri ? nameFromUri(asset.uri, fallbackName) : fallbackName);

  const isImage = asset.mimeType?.startsWith('image/') ?? false;

  return {
    fileName: nameFromUri(asset.uri, fileName),
    type: isImage ? 'FIELD_PHOTO' : 'OTHER',
    // Kept for documents too, not only images: a PDF needs its bytes uploaded
    // just as much as a photo does.
    localUri: asset.uri,
    mimeType: asset.mimeType ?? undefined,
  };
}

/** MIME type sent with the upload, matching what the server accepts. */
export function uploadMimeType(picked: PickedEvidence): string | undefined {
  return picked.mimeType;
}