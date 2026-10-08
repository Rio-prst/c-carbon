export const SCORE_REPOSITORY = Symbol('SCORE_REPOSITORY');

export type ScoreType = 'FSS' | 'CRS';

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

/**
 * The CRS components are keyed in snake_case because that is the wire
 * contract, while FSS is camelCase. Both shapes are stored through one
 * repository, so the persisted type has to allow either.
 *
 * These keys are restated here rather than imported from `crs/` because `crs`
 * already depends on this module, and importing the other way would create a
 * cycle. The duplication is the drift check: adding a component to
 * `CRS_WEIGHTS` stops the assignment in `ReadinessService` from compiling.
 */
export type CRSBreakdown = {
  eligible_practice: number;
  data_completeness: number;
  baseline_availability: number;
  verification_readiness: number;
  aggregation_suitability: number;
};

export type ScoreBreakdown = FSSBreakdown | CRSBreakdown;

export type ScoreBreakdownByType = {
  FSS: FSSBreakdown;
  CRS: CRSBreakdown;
};

export type CreateScoreInput = {
  farmId: string;
  scoreType: ScoreType;
  value: number;
  breakdown: ScoreBreakdown;
  isProvisional: boolean;
};

export type ScoreRecord = {
  id: string;
  farmId: string;
  scoreType: ScoreType;
  value: number;
  breakdown: ScoreBreakdown;
  isProvisional: boolean;
  calculatedAt: Date;
};

/**
 * A stored record narrowed to the breakdown shape its score type uses.
 *
 * `Omit` rather than an intersection: `ScoreRecord & { breakdown: CRSBreakdown }`
 * would demand the breakdown satisfy both the union and the concrete shape, which
 * no value can, so callers could not construct one without a cast.
 */
export type StoredScore<K extends ScoreType> = Omit<
  ScoreRecord,
  'breakdown'
> & {
  breakdown: ScoreBreakdownByType[K];
};

export interface IScoreRepository {
  save(score: CreateScoreInput): Promise<ScoreRecord>;
  /**
   * Typed on the requested score type so a caller reading `FSS` cannot
   * silently index CRS components out of the breakdown.
   */
  findByFarmId<K extends ScoreType>(
    farmId: string,
    scoreType: K,
  ): Promise<StoredScore<K> | null>;
}
