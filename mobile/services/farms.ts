import { apiRequest } from '../lib/api';
import type { CreateFarmInput, Farm } from '../types/farm';

export function listFarms(token: string): Promise<Farm[]> {
  return apiRequest<Farm[]>('/farms', { token });
}

export function getFarm(id: string, token: string): Promise<Farm> {
  return apiRequest<Farm>(`/farms/${id}`, { token });
}

export function createFarm(input: CreateFarmInput, token: string): Promise<Farm> {
  return apiRequest<Farm>('/farms', {
    method: 'POST',
    body: input,
    token,
  });
}
