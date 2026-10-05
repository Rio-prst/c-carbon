import { apiRequest } from '../lib/api';
import type { FarmScore } from '../types/score';

export function getScore(farmId: string, token: string): Promise<FarmScore | null> {
  return apiRequest<FarmScore | null>(`/farms/${farmId}/score`, { token });
}