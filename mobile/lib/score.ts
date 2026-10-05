import type { FSSBreakdown, FarmScore } from '../types/score';

type ComponentMeta = {
  key: keyof FSSBreakdown;
  label: string;
  weightPercent: number;
};

/** Weighting per PRD, kept in the same order as the breakdown. */
export const FSS_COMPONENTS: ComponentMeta[] = [
  { key: 'productivity', label: 'Produktivitas', weightPercent: 20 },
  { key: 'inputEfficiency', label: 'Efisiensi input', weightPercent: 15 },
  { key: 'waterEfficiency', label: 'Efisiensi air', weightPercent: 15 },
  { key: 'fertilizerManagement', label: 'Pengelolaan pupuk', weightPercent: 10 },
  { key: 'wasteManagement', label: 'Pengelolaan sampah', weightPercent: 10 },
  { key: 'soilConservation', label: 'Konservasi tanah', weightPercent: 10 },
  { key: 'energy', label: 'Energi', weightPercent: 5 },
  { key: 'riskHistory', label: 'Riwayat risiko', weightPercent: 5 },
  { key: 'dataConsistency', label: 'Kelengkapan data', weightPercent: 5 },
  { key: 'lowCarbonPractice', label: 'Praktik rendah karbon', weightPercent: 5 },
];

export type ScoreComponent = ComponentMeta & {
  score: number;
  /** Points this component contributes to the final 0-100 value. */
  contribution: number;
};

export function buildComponents(score: FarmScore): ScoreComponent[] {
  return FSS_COMPONENTS.map((component) => {
    const value = score.breakdown[component.key] ?? 0;

    return {
      ...component,
      score: value,
      contribution: (value * component.weightPercent) / 100,
    };
  });
}

export function scoreBand(value: number): string {
  if (value >= 80) return 'Sangat baik';
  if (value >= 60) return 'Baik';
  if (value >= 40) return 'Cukup';
  return 'Perlu perbaikan';
}