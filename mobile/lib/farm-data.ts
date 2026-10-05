import type { FarmDataStatus } from '../types/farm-data';

type StatusMeta = {
  label: string;
  tone: 'neutral' | 'warning' | 'success' | 'error';
  description: string;
};

const STATUS_META: Record<FarmDataStatus, StatusMeta> = {
  SELF_REPORTED: {
    label: 'Dilaporkan',
    tone: 'neutral',
    description: 'Menunggu peninjauan admin.',
  },
  REVIEW: {
    label: 'Ditinjau',
    tone: 'warning',
    description: 'Sedang ditinjau oleh admin.',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    tone: 'success',
    description: 'Data sudah diverifikasi dan dipakai untuk penilaian.',
  },
  REJECTED: {
    label: 'Ditolak',
    tone: 'error',
    description: 'Data ditolak. Lihat alasan penolakan dan kirim ulang.',
  },
};

export function farmDataStatusMeta(status: FarmDataStatus): StatusMeta {
  return STATUS_META[status];
}

type PracticeOption = {
  value: string;
  label: string;
};

export const WASTE_PRACTICE_OPTIONS: PracticeOption[] = [
  { value: 'composting', label: 'Komposting' },
  { value: 'recycling', label: 'Daur ulang' },
  { value: 'incineration', label: 'Pembakaran terkontrol' },
  { value: 'landfill', label: 'Tempat pembuangan akhir' },
  { value: 'none', label: 'Belum ada penanganan' },
];

export const SOIL_PRACTICE_OPTIONS: PracticeOption[] = [
  { value: 'cover_cropping', label: 'Tanam penutup' },
  { value: 'crop_rotation', label: 'Rotasi tanaman' },
  { value: 'no_till', label: 'Tanpa olah tanah' },
  { value: 'reduced_till', label: 'Olah tanah berkurang' },
  { value: 'conventional', label: 'Olah tanah konvensional' },
  { value: 'none', label: 'Belum ada praktik' },
];

export function formatSubmissionDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatOptionalNumber(value: number | undefined): string {
  if (value == null) return '-';
  return value.toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

/** Short summary of the numeric readings, for the history list. */
export function summarizeFarmData(data: {
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
}): string {
  const parts: string[] = [];

  if (data.yieldKg != null) {
    parts.push(`Panen ${formatOptionalNumber(data.yieldKg)} kg`);
  }
  if (data.waterUsage != null) {
    parts.push(`Air ${formatOptionalNumber(data.waterUsage)} m3`);
  }
  if (data.fertilizerUsage != null) {
    parts.push(`Pupuk ${formatOptionalNumber(data.fertilizerUsage)} kg`);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Tidak ada angka terisi';
}