import { Injectable } from '@nestjs/common';
import type {
  CreateScoreInput,
  ScoreRecord,
  IScoreRepository,
  ScoreType,
} from './score.repository.interface';

@Injectable()
export class ScoreRepository implements IScoreRepository {
  private scoreMap: Map<string, Map<ScoreType, ScoreRecord>> = new Map();

  private getFarmScores(farmId: string): Map<ScoreType, ScoreRecord> {
    if (!this.scoreMap.has(farmId)) {
      this.scoreMap.set(farmId, new Map());
    }
    return this.scoreMap.get(farmId)!;
  }

  async save(input: CreateScoreInput): Promise<ScoreRecord> {
    const farmScores = this.getFarmScores(input.farmId);
    const score: ScoreRecord = {
      id: crypto.randomUUID(),
      farmId: input.farmId,
      scoreType: input.scoreType,
      value: input.value,
      breakdown: input.breakdown,
      isProvisional: input.isProvisional,
      calculatedAt: new Date(),
    };
    farmScores.set(input.scoreType, score);
    return score;
  }

  async findByFarmId(farmId: string, scoreType: ScoreType): Promise<ScoreRecord | null> {
    const farmScores = this.scoreMap.get(farmId);
    if (!farmScores) return null;
    return farmScores.get(scoreType) ?? null;
  }
}
