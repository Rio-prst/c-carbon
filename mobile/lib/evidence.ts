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
 * A local `file://` uri is not shareable, so it is kept for the in-session
 * preview only and never uploaded as `url`: another reviewer would only get a
 * broken link. MVP records the file name and type as the evidence reference.
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
    localUri: isImage ? asset.uri : undefined,
    mimeType: asset.mimeType ?? undefined,
  };
}