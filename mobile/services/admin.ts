import { apiRequest } from '../lib/api';
import type { AuditRecord, ReviewQueueItem } from '../types/admin';

export function getReviewQueue(token: string): Promise<ReviewQueueItem[]> {
  return apiRequest<ReviewQueueItem[]>('/admin/farm-data', { token });
}

export function startReview(id: string, token: string): Promise<unknown> {
  return apiRequest(`/admin/farm-data/${id}/start-review`, {
    method: 'PATCH',
    token,
  });
}

export function verifyFarmData(id: string, token: string): Promise<unknown> {
  return apiRequest(`/admin/farm-data/${id}/verify`, {
    method: 'POST',
    token,
  });
}

export function rejectFarmData(
  id: string,
  rejectionReason: string,
  token: string,
): Promise<unknown> {
  return apiRequest(`/admin/farm-data/${id}/reject`, {
    method: 'POST',
    body: { rejectionReason },
    token,
  });
}

export function getAuditLog(token: string): Promise<AuditRecord[]> {
  return apiRequest<AuditRecord[]>('/admin/audit-log', { token });
}