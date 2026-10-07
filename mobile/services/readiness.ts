import { apiRequest } from '../lib/api';
import type { CRSReadiness } from '../types/readiness';

export function getReadiness(
  farmId: string,
  token: string,
): Promise<CRSReadiness | null> {
  return apiRequest<CRSReadiness | null>(`/farms/${farmId}/readiness`, {
    token,
  });
}