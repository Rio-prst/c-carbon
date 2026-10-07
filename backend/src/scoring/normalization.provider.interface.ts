export const NORMALIZATION_PROVIDER = Symbol('NORMALIZATION_PROVIDER');

/**
 * Reference range for one metric, used to turn a raw reading into a 0-100
 * score. `direction` records whether a higher reading is better.
 */
export type ReferenceRange = {
  /** Human readable source of the range, surfaced to the farmer in the UI. */
  source: string;
  direction: 'higher_is_better' | 'lower_is_better';
  /** Reading at or below this value scores 0 (or 100 for lower_is_better). */
  worst: number;
  /** Reading at or above this value scores 100 (or 0 for lower_is_better). */
  best: number;
  /** The value treated as a perfect score when the reading is absent. */
  optimal?: number;
};

/**
 * Maps raw farm readings onto 0-100 scores.
 *
 * Implementations must never invent ranges. Ranges that are not yet backed by
 * an agronomic source belong in a provider that reports itself as provisional
 * so the score is never presented as verified.
 */
export interface INormalizationProvider {
  /** False when every range comes from a real source. */
  readonly isProvisional: boolean;

  productivity(yieldKg: number): number;
  waterEfficiency(waterUsage: number): number;
  inputEfficiency(fertilizerUsage: number, pesticideUsage: number): number;
  fertilizerManagement(fertilizerUsage: number): number;
  energy(energyUsage: number): number;

  /** Score for a named practice, or null when the practice is unknown. */
  practiceScore(
    practice: string,
    kind: 'waste_management' | 'soil_conservation',
  ): number | null;

  /** The ranges in use, so the UI can disclose the assumptions. */
  referenceRanges(): ReferenceRange[];
}
