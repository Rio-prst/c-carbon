import type { ReviewQueueItem } from '../types/admin';

export const PRACTICE_LABELS: Record<string, string> = {
  composting: 'Komposting',
  recycling: 'Daur ulang',
  incineration: 'Pembakaran terkontrol',
  landfill: 'Tempat pembuangan akhir',
  none: 'Belum ada penanganan',
  cover_cropping: 'Tanam penutup',
  crop_rotation: 'Rotasi tanaman',
  no_till: 'Tanpa olah tanah',
  reduced_till: 'Olah tanah berkurang',
  conventional: 'Olah tanah konvensional',
};

export function practiceLabel(value?: string): string {
  if (value == null || value.trim() === '') return '-';
  return PRACTICE_LABELS[value] ?? value;
}

export type QueueFilter = 'ALL' | 'SELF_REPORTED' | 'REVIEW' | 'REJECTED';

export function filterQueue(
  items: ReviewQueueItem[],
  filter: QueueFilter,
): ReviewQueueItem[] {
  if (filter === 'ALL') return items;
  return items.filter((item) => item.status === filter);
}

/**
 * A submission without evidence can still be reviewed, but the reviewer
 * should see that before deciding, rather than after.
 */
export function evidenceNote(item: ReviewQueueItem): string | undefined {
  if (item.evidenceCount > 0) return undefined;
  return 'Belum ada bukti dukung terlampir';
}

export function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}