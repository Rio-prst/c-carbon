export const REWARD_REPOSITORY = Symbol('REWARD_REPOSITORY');

export type RewardTier = 'BASIC' | 'SILVER' | 'GOLD' | 'CARBON_READY';

export type RewardEventType =
  | 'FARM_DATA_SUBMISSION'
  | 'VERIFICATION'
  | 'FSS_IMPROVEMENT'
  | 'SUSTAINABLE_PRACTICE'
  | 'MILESTONE_BONUS';

export type CreateRewardInput = {
  userId: string;
  eventType: RewardEventType;
  points: number;
  totalPointsSnapshot: number;
  tierSnapshot: RewardTier;
  description?: string;
};

export type RewardRecord = {
  id: string;
  userId: string;
  eventType: RewardEventType;
  points: number;
  totalPointsSnapshot: number;
  tierSnapshot: RewardTier;
  description?: string;
  createdAt: Date;
};

export interface IRewardRepository {
  create(input: CreateRewardInput): Promise<RewardRecord>;
  findByUserId(userId: string): Promise<RewardRecord[]>;
  getTotalPoints(userId: string): Promise<number>;
}
