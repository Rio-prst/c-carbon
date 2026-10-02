export const SCORE_REPOSITORY = Symbol('SCORE_REPOSITORY');

export type ScoreType = 'FSS' | 'CRS';

export type ScoreBreakdown = {
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

export interface IScoreRepository {
  save(score: CreateScoreInput): Promise<ScoreRecord>;
  findByFarmId(
    farmId: string,
    scoreType: ScoreType,
  ): Promise<ScoreRecord | null>;
}
