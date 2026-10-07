import { apiRequest } from '../lib/api';
import type { CorporateOverview } from '../types/corporate';

export function getCorporateOverview(
  token: string,
): Promise<CorporateOverview> {
  return apiRequest<CorporateOverview>('/corporate/overview', { token });
}