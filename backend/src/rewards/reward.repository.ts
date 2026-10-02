import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateRewardInput,
  RewardRecord,
  IRewardRepository,
} from './reward.repository.interface';

@Injectable()
export class RewardRepository implements IRewardRepository {
  private rewardMap: Map<string, RewardRecord[]> = new Map();

  private getUserRewards(userId: string): RewardRecord[] {
    if (!this.rewardMap.has(userId)) {
      this.rewardMap.set(userId, []);
    }
    return this.rewardMap.get(userId)!;
  }

  create(input: CreateRewardInput): Promise<RewardRecord> {
    const rewards = this.getUserRewards(input.userId);
    const reward: RewardRecord = {
      id: randomUUID(),
      userId: input.userId,
      eventType: input.eventType,
      points: input.points,
      totalPointsSnapshot: input.totalPointsSnapshot,
      tierSnapshot: input.tierSnapshot,
      description: input.description,
      createdAt: new Date(),
    };
    rewards.unshift(reward);
    return Promise.resolve(reward);
  }

  findByUserId(userId: string): Promise<RewardRecord[]> {
    return Promise.resolve(this.getUserRewards(userId));
  }

  getTotalPoints(userId: string): Promise<number> {
    const rewards = this.getUserRewards(userId);
    return Promise.resolve(rewards.reduce((sum, r) => sum + r.points, 0));
  }
}
