import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateScoreInput,
  IScoreRepository,
  ScoreBreakdown,
  ScoreBreakdownByType,
  ScoreRecord,
  ScoreType,
  StoredScore,
} from './score.repository.interface';

type ScoreRow = {
  id: string;
  farmId: string;
  scoreType: string;
  value: { toString(): string };
  breakdown: unknown;
  isProvisional: boolean;
  calculatedAt: Date;
  supersededAt: Date | null;
};

function toScoreRecord(row: ScoreRow): ScoreRecord {
  return {
    id: row.id,
    farmId: row.farmId,
    scoreType: row.scoreType as ScoreType,
    value: Number(row.value.toString()),
    // JSONB round-trips to plain numbers, which is what both breakdowns are.
    breakdown: row.breakdown as ScoreBreakdown,
    isProvisional: row.isProvisional,
    calculatedAt: row.calculatedAt,
  };
}

/**
 * Persisted rather than held in a Map.
 *
 * The FSS is one of the two scores the farmer is shown, and while it lived in
 * memory it disappeared on restart and had to be rebuilt by the seed. The
 * unique pair on farm and score type keeps the overwrite semantics the previous
 * implementation had, so callers see no difference.
 */
@Injectable()
export class ScoreRepository implements IScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(input: CreateScoreInput): Promise<ScoreRecord> {
    const row = await this.prisma.score.upsert({
      where: {
        farmId_scoreType: {
          farmId: input.farmId,
          scoreType: input.scoreType,
        },
      },
      // Overwrites rather than appending, matching the previous Map behaviour
      // where one farm and score type held a single score.
      create: {
        farmId: input.farmId,
        scoreType: input.scoreType,
        value: input.value,
        breakdown: input.breakdown,
        isProvisional: input.isProvisional,
      },
      update: {
        value: input.value,
        breakdown: input.breakdown,
        isProvisional: input.isProvisional,
        calculatedAt: new Date(),
        // A fresh calculation supersedes whatever was stored, which is what a
        // history table would key on if it is ever added.
        supersededAt: null,
      },
      select: {
        id: true,
        farmId: true,
        scoreType: true,
        value: true,
        breakdown: true,
        isProvisional: true,
        calculatedAt: true,
        supersededAt: true,
      },
    });
    return toScoreRecord(row);
  }

  async findByFarmId<K extends ScoreType>(
    farmId: string,
    scoreType: K,
  ): Promise<StoredScore<K> | null> {
    const row = await this.prisma.score.findUnique({
      where: { farmId_scoreType: { farmId, scoreType } },
      select: {
        id: true,
        farmId: true,
        scoreType: true,
        value: true,
        breakdown: true,
        isProvisional: true,
        calculatedAt: true,
        supersededAt: true,
      },
    });

    if (!row) return null;
    // The row's breakdown is whichever shape its score type uses. The write
    // path is typed, so the two cannot disagree.
    const { breakdown, ...rest } = toScoreRecord(row);
    return {
      ...rest,
      breakdown: breakdown as ScoreBreakdownByType[K],
    };
  }
}
