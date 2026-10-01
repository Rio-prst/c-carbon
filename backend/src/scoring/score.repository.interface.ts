export const FSS_REPOSITORY = Symbol('FSS_REPOSITORY');

export type ScoreType = 'FSS' | 'CRS';

export type CreateScoreInput = {
  farmId: string;
  scoreType: ScoreType;
  value: number;
  breakdown: Record<string, number> | {
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
  isProvisional: boolean;
};

export type ScoreRecord = {
  id: string;
  farmId: string;
  scoreType: ScoreType;
  value: number;
  breakdown: Record<string, number>;
  isProvisional: boolean;
  calculatedAt: Date;
};

export interface IScoreRepository {
  save(score: CreateScoreInput): Promise<ScoreRecord>;
  findByFarmId(farmId: string, scoreType: ScoreType): Promise<ScoreRecord | null>;
}
