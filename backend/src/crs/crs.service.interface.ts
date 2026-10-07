export const CRS_SERVICE = Symbol('CRS_SERVICE');

export const CRS_WEIGHTS = {
  eligible_practice: 40,
  data_completeness: 25,
  baseline_availability: 15,
  verification_readiness: 10,
  aggregation_suitability: 10,
} as const;

export type CRSComponentKey = keyof typeof CRS_WEIGHTS;

export type CRSBreakdown = Record<CRSComponentKey, number>;

export type CRSResult = {
  value: number;
  breakdown: CRSBreakdown;
  /**
   * Components that could not be assessed at all, with the reason. They are
   * excluded from the weighted average rather than scored 0, so an absent
   * baseline is not reported as a failing baseline.
   */
  unavailable: { component: CRSComponentKey; reason: string }[];
  /**
   * True when the score excludes unavailable components or the reference
   * ranges are still placeholders.
   */
  isProvisional: boolean;
  /** Actions the farmer still needs to take, most important first. */
  nextActions: string[];
};

export interface ICRSService {
  calculateCRS(input: CRSInput): Promise<CRSResult>;
}

export type CRSInput = {
  farmId: string;
  farmData: {
    soilPractice?: string;
    wasteManagementPractice?: string;
    lowCarbonPractice: boolean;
    status: string;
    yieldKg?: number;
    waterUsage?: number;
    fertilizerUsage?: number;
    pesticideUsage?: number;
    energyUsage?: number;
  }[];
  evidenceCount: number;
  farm: {
    landAreaHa: number;
    lat: number;
    lng: number;
    commodity: string;
  };
};
