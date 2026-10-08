import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateRewardInput,
  IRewardRepository,
  RewardEventType,
  RewardRecord,
  RewardTier,
} from './reward.repository.interface';

type RewardRow = {
  id: string;
  userId: string;
  eventType: string;
  points: number;
  totalPointsSnapshot: number;
  tierSnapshot: string;
  description: string | null;
  createdAt: Date;
};

const SELECT = {
  id: true,
  userId: true,
  eventType: true,
  points: true,
  totalPointsSnapshot: true,
  tierSnapshot: true,
  description: true,
  createdAt: true,
} as const;

function toRecord(row: RewardRow): RewardRecord {
  return {
    id: row.id,
    userId: row.userId,
    eventType: row.eventType as RewardEventType,
    points: row.points,
    totalPointsSnapshot: row.totalPointsSnapshot,
    tierSnapshot: row.tierSnapshot as RewardTier,
    // The column is nullable while the previous Map stored an absent key, so
    // the optional field is preserved rather than widened to string | null.
    description: row.description ?? undefined,
    createdAt: row.createdAt,
  };
}

/**
 * Persisted rather than held in a Map.
 *
 * The old Map was per-process, so the points total a farmer was shown dropped to
 * zero on restart and the tier recomputed down to BASIC. The summary reads the
 * same shape either way; only the source changed.
 */
@Injectable()
export class RewardRepository implements IRewardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRewardInput): Promise<RewardRecord> {
    const row = await this.prisma.rewardEvent.create({
      data: {
        userId: input.userId,
        eventType: input.eventType,
        points: input.points,
        totalPointsSnapshot: input.totalPointsSnapshot,
        tierSnapshot: input.tierSnapshot,
        description: input.description,
      },
      select: SELECT,
    });
    return toRecord(row);
  }

  async findByUserId(userId: string): Promise<RewardRecord[]> {
    // Newest first, matching the previous implementation which unshifted onto
    // the front of the array. The id is the tiebreaker so two events created in
    // the same millisecond cannot swap order between reads.
    const rows = await this.prisma.rewardEvent.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: SELECT,
    });
    return rows.map(toRecord);
  }

  async getTotalPoints(userId: string): Promise<number> {
    const aggregate = await this.prisma.rewardEvent.aggregate({
      where: { userId },
      _sum: { points: true },
    });
    return aggregate._sum.points ?? 0;
  }
}
