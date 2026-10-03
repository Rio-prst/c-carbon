import type { InsuranceStatus } from '../types/insurance';

type StatusMeta = {
  label: string;
  tone: 'success' | 'warning' | 'error' | 'neutral';
  notice: string;
};

/**
 * Insurance is informational only in MVP. The partner underwrites the policy,
 * so the copy must never imply the platform itself provides the coverage.
 */
export function insuranceStatusMeta(status: InsuranceStatus): StatusMeta {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Aktif',
        tone: 'success',
        notice: 'Polis aktif. Pastikan detail polis tetap sesuai dengan kondisi lahan Anda.',
      };
    case 'PENDING':
      return {
        label: 'Menunggu',
        tone: 'warning',
        notice:
          'Polis belum aktif. Lahan Anda belum tercakup penuh sampai mitra-asuransi mengesahkan polis.',
      };
    case 'EXPIRED':
      return {
        label: 'Kedaluwarsa',
        tone: 'error',
        notice:
          'Polis sudah kedaluwarsa. Hubungi mitra-asuransi Anda untuk memperbarui polis.',
      };
  }
}