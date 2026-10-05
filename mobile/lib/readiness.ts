import type { CRSReadiness } from '../types/readiness';

export type ReadinessComponent = {
  key: keyof CRSReadiness['breakdown'];
  label: string;
  weightPercent: number;
};

/** Weighting per prototype spec. */
export const READINESS_COMPONENTS: ReadinessComponent[] = [
  { key: 'eligible_practice', label: 'Praktik layak', weightPercent: 40 },
  { key: 'data_completeness', label: 'Kelengkapan data', weightPercent: 25 },
  {
    key: 'baseline_availability',
    label: 'Ketersediaan baseline',
    weightPercent: 15,
  },
  {
    key: 'verification_readiness',
    label: 'Kesiapan verifikasi',
    weightPercent: 10,
  },
  {
    key: 'aggregation_suitability',
    label: 'Kesesuaian agregasi',
    weightPercent: 10,
  },
];

export function isComponentUnavailable(
  readiness: CRSReadiness,
  key: string,
): boolean {
  return readiness.unavailable.some((entry) => entry.component === key);
}

export function unavailableReason(
  readiness: CRSReadiness,
  key: string,
): string | undefined {
  return readiness.unavailable.find((entry) => entry.component === key)?.reason;
}