import { randomUUID } from 'node:crypto';
import type {
  CreateRewardInput,
  IRewardRepository,
  RewardRecord,
} from '../rewards/reward.repository.interface';

/**
 * Test double for the rewards port.
 *
 * Keeps history newest first and sums points for the total, matching the two
 * orderings the previous in-memory implementation relied on.
 */
export class InMemoryRewardRepository implements IRewardRepository {
  private readonly byUser = new Map<string, RewardRecord[]>();

  create(input: CreateRewardInput): Promise<RewardRecord> {
    const record: RewardRecord = {
      id: randomUUID(),
      userId: input.userId,
      eventType: input.eventType,
      points: input.points,
      totalPointsSnapshot: input.totalPointsSnapshot,
      tierSnapshot: input.tierSnapshot,
      description: input.description,
      createdAt: new Date(),
    };
    const history = this.byUser.get(input.userId) ?? [];
    history.unshift(record);
    this.byUser.set(input.userId, history);
    return Promise.resolve(record);
  }

  findByUserId(userId: string): Promise<RewardRecord[]> {
    return Promise.resolve(this.byUser.get(userId) ?? []);
  }

  getTotalPoints(userId: string): Promise<number> {
    const history = this.byUser.get(userId) ?? [];
    return Promise.resolve(history.reduce((sum, r) => sum + r.points, 0));
  }
}
