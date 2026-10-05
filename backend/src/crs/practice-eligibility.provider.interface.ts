export const PRACTICE_ELIGIBILITY_PROVIDER = Symbol(
  'PRACTICE_ELIGIBILITY_PROVIDER',
);

export interface IPracticeEligibilityProvider {
  /** False once methodology-specific eligibility rules are confirmed. */
  readonly isProvisional: boolean;

  isSoilPracticeEligible(practice?: string): boolean;

  isWastePracticeEligible(practice?: string): boolean;
}
