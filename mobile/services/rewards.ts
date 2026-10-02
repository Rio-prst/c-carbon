import { apiRequest } from '../lib/api';
import type { RewardsSummary } from '../types/reward';

export function getRewardsSummary(token: string): Promise<RewardsSummary> {
  return apiRequest<RewardsSummary>('/rewards', { token });
}
