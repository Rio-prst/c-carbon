export type CRSUnavailable = {
  component: string;
  reason: string;
};

export type CRSReadiness = {
  crs_value: number;
  is_provisional: boolean;
  breakdown: {
    eligible_practice?: number;
    data_completeness?: number;
    baseline_availability?: number;
    verification_readiness?: number;
    aggregation_suitability?: number;
  };
  unavailable: CRSUnavailable[];
  next_actions: string[];
  disclaimer: string;
};