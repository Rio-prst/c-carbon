export type RewardTier = 'BASIC' | 'SILVER' | 'GOLD' | 'CARBON_READY';

export type RewardEventType =
  | 'FARM_DATA_SUBMISSION'
  | 'VERIFICATION'
  | 'FSS_IMPROVEMENT'
  | 'SUSTAINABLE_PRACTICE'
  | 'MILESTONE_BONUS';

export interface RewardHistoryItem {
  id: string;
  event_type: RewardEventType;
  points: number;
  total_points: number;
  tier: RewardTier;
  description?: string;
  created_at: string;
}

export interface RewardsSummary {
  total_points: number;
  tier: RewardTier;
  history: RewardHistoryItem[];
}
