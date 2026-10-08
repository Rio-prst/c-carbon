export const PROJECT_ELIGIBILITY_PROVIDER = Symbol(
  'PROJECT_ELIGIBILITY_PROVIDER',
);

/**
 * The farm attributes a gate needs, kept separate from the full farm record so
 * the provider stays free of persistence concerns.
 */
export type EligibilityFarm = {
  id: string;
  landAreaHa: number;
  commodity: string;
};

export type EligibilitySubmission = {
  status: string;
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
  pesticideUsage?: number;
  energyUsage?: number;
  soilPractice?: string;
  wasteManagementPractice?: string;
  lowCarbonPractice: boolean;
};

export type EligibilityCriterionKey =
  | 'verification'
  | 'data_completeness'
  | 'eligible_practice'
  | 'aggregation_suitability'
  | 'consent';

export type CriterionResult = {
  key: EligibilityCriterionKey;
  passed: boolean;
  reason: string;
};

export type EligibilityVerdict = {
  eligible: boolean;
  criteria: CriterionResult[];
  /** Baseline cannot be assessed in MVP, so it is reported rather than gated. */
  notAssessed: { component: string; reason: string }[];
  /**
   * True when the verdict only covers the conditions this platform can
   * evaluate. Must be surfaced so a project is never presented as a
   * carbon-credit claim.
   */
  isProvisional: boolean;
};

export interface IProjectEligibilityProvider {
  readonly isProvisional: boolean;
  readonly minEligibleFarms: number;
  readonly minLandAreaHa: number;

  evaluate(
    farm: EligibilityFarm,
    submissions: EligibilitySubmission[],
  ): EligibilityVerdict;
}
