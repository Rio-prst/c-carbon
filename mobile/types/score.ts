export type FSSBreakdown = {
  productivity: number;
  inputEfficiency: number;
  waterEfficiency: number;
  fertilizerManagement: number;
  wasteManagement: number;
  soilConservation: number;
  energy: number;
  riskHistory: number;
  dataConsistency: number;
  lowCarbonPractice: number;
};

export type ReferenceRange = {
  source: string;
  direction: 'higher_is_better' | 'lower_is_better';
  worst: number;
  best: number;
  optimal?: number;
};

export type FarmScore = {
  fss_value: number;
  is_provisional: boolean;
  breakdown: Partial<FSSBreakdown>;
  provisional_reason?: string;
  reference_ranges?: ReferenceRange[];
};