import { apiRequest } from '../lib/api';
import type { Insurance } from '../types/insurance';

export function getInsurance(
  farmId: string,
  token: string,
): Promise<Insurance | null> {
  return apiRequest<Insurance | null>(`/farms/${farmId}/insurance`, { token });
}