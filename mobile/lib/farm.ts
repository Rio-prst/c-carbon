import type { FarmStatus } from '../types/farm';

type StatusMeta = {
  label: string;
  tone: 'success' | 'warning' | 'info' | 'neutral';
};

export function farmStatusMeta(status: FarmStatus): StatusMeta {
  switch (status) {
    case 'REGISTERED':
      return { label: 'Terdaftar', tone: 'neutral' };
    case 'DATA_COLLECTION':
      return { label: 'Pengumpulan Data', tone: 'warning' };
    case 'ASSESSED':
      return { label: 'Terukur', tone: 'info' };
    case 'CARBON_CANDIDATE':
      return { label: 'Kandidat Karbon', tone: 'success' };
  }
}

export function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

export function formatLandArea(hectares: number): string {
  return `${hectares.toFixed(2)} ha`;
}
