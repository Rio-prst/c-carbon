import { randomUUID } from 'node:crypto';
import type {
  CreateScoreInput,
  IScoreRepository,
  ScoreRecord,
  ScoreBreakdownByType,
  ScoreType,
  StoredScore,
} from '../scoring/score.repository.interface';

/**
 * Test double for the scoring port.
 *
 * The production repository is Prisma-backed, so unit tests use this instead
 * rather than standing up a database. It keeps one score per farm and score
 * type, matching the unique pair on the real table, and mints a new id per
 * save so a test can tell a rewritten score from an untouched one.
 */
export class InMemoryScoreRepository implements IScoreRepository {
  private readonly scores = new Map<string, ScoreRecord>();

  private key(farmId: string, scoreType: ScoreType): string {
    return `${farmId}::${scoreType}`;
  }

  save(input: CreateScoreInput): Promise<ScoreRecord> {
    const record: ScoreRecord = {
      id: randomUUID(),
      farmId: input.farmId,
      scoreType: input.scoreType,
      value: input.value,
      breakdown: input.breakdown,
      isProvisional: input.isProvisional,
      calculatedAt: new Date(),
    };
    this.scores.set(this.key(input.farmId, input.scoreType), record);
    return Promise.resolve(record);
  }

  findByFarmId<K extends ScoreType>(
    farmId: string,
    scoreType: K,
  ): Promise<StoredScore<K> | null> {
    const record = this.scores.get(this.key(farmId, scoreType));
    if (!record) return Promise.resolve(null);
    // The map holds whichever breakdown shape was written for that score type.
    // The write path is typed, so the two cannot disagree.
    const { breakdown, ...rest } = record;
    return Promise.resolve({
      ...rest,
      breakdown: breakdown as ScoreBreakdownByType[K],
    });
  }
}
