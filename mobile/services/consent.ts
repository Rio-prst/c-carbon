import { apiRequest } from '../lib/api';
import type { ConsentStatus } from '../types/consent';

export function getConsents(token: string): Promise<ConsentStatus> {
  return apiRequest<ConsentStatus>('/consent', { token });
}

export function revokeConsent(
  purpose: string,
  token: string,
): Promise<ConsentStatus> {
  return apiRequest<ConsentStatus>('/consent/revoke', {
    method: 'POST',
    body: { purpose },
    token,
  });
}