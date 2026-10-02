import type { FarmStatus } from '../types/farm';

type StatusMeta = {
  label: string;
  description: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
};

export function farmStatusMeta(status: FarmStatus): StatusMeta {
  switch (status) {
    case 'REGISTERED':
      return {
        label: 'Terdaftar',
        description: 'Lahan baru terdaftar, belum ada data musiman.',
        tone: 'neutral',
      };
    case 'DATA_COLLECTION':
      return {
        label: 'Pengumpulan Data',
        description: 'Pengumpulan data musiman sedang berjalan.',
        tone: 'warning',
      };
    case 'ASSESSED':
      return {
        label: 'Terukur',
        description: 'Data sudah diukur dan dinilai.',
        tone: 'info',
      };
    case 'CARBON_CANDIDATE':
      return {
        label: 'Kandidat Karbon',
        description: 'Lahan masuk daftar kandidat proyek karbon.',
        tone: 'success',
      };
  }
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function formatLandArea(hectares: number): string {
  return `${hectares.toFixed(2)} ha`;
}
