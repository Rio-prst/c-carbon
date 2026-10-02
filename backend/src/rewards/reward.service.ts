import { Inject, Injectable } from '@nestjs/common';
import {
  REWARD_REPOSITORY,
  type IRewardRepository,
  type RewardEventType,
  type RewardRecord,
  type RewardTier,
} from './reward.repository.interface';

export interface RewardsSummaryResponse {
  total_points: number;
  tier: RewardTier;
  history: Array<{
    id: string;
    event_type: RewardEventType;
    points: number;
    total_points: number;
    tier: RewardTier;
    description?: string;
    created_at: string;
  }>;
}

@Injectable()
export class RewardService {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: IRewardRepository,
  ) {}

  private readonly eventPoints: Record<RewardEventType, number> = {
    FARM_DATA_SUBMISSION: 50,
    VERIFICATION: 100,
    FSS_IMPROVEMENT: 75,
    SUSTAINABLE_PRACTICE: 60,
    MILESTONE_BONUS: 150,
  };

  calculateTier(points: number): RewardTier {
    if (points >= 900) return 'CARBON_READY';
    if (points >= 700) return 'GOLD';
    if (points >= 400) return 'SILVER';
    return 'BASIC';
  }

  async awardEvent(
    userId: string,
    eventType: RewardEventType,
    options?: { points?: number; description?: string },
  ): Promise<RewardRecord> {
    const points = options?.points ?? this.eventPoints[eventType] ?? 50;
    const currentTotal = await this.rewardRepository.getTotalPoints(userId);
    const newTotal = currentTotal + points;
    const newTier = this.calculateTier(newTotal);

    return this.rewardRepository.create({
      userId,
      eventType,
      points,
      totalPointsSnapshot: newTotal,
      tierSnapshot: newTier,
      description: options?.description,
    });
  }

  async getRewardsSummary(userId: string): Promise<RewardsSummaryResponse> {
    const currentTotal = await this.rewardRepository.getTotalPoints(userId);
    const history = await this.rewardRepository.findByUserId(userId);
    const tier = this.calculateTier(currentTotal);

    return {
      total_points: currentTotal,
      tier,
      history: history.map((item) => ({
        id: item.id,
        event_type: item.eventType,
        points: item.points,
        total_points: item.totalPointsSnapshot,
        tier: item.tierSnapshot,
        description: item.description,
        created_at: item.createdAt.toISOString(),
      })),
    };
  }
}
