import { apiRequest } from '../lib/api';
import type {
  AggregationResult,
  CreateProjectPayload,
  EligibleFarmFilter,
  ProjectSummary,
} from '../types/carbon-project';

export function listProjects(token: string): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>('/carbon/projects', { token });
}

export function getProject(
  id: string,
  token: string,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(`/carbon/projects/${id}`, { token });
}

export function listAdminProjects(
  token: string,
): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>('/admin/carbon-projects', { token });
}

export function createProject(
  payload: CreateProjectPayload,
  token: string,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>('/admin/carbon-projects', {
    method: 'POST',
    body: payload,
    token,
  });
}

export function getEligibleFarms(token: string): Promise<EligibleFarmFilter> {
  return apiRequest<EligibleFarmFilter>(
    '/admin/carbon-projects/eligible-farms',
    { token },
  );
}

export function aggregateProject(
  id: string,
  token: string,
): Promise<AggregationResult> {
  return apiRequest<AggregationResult>(
    `/admin/carbon-projects/${id}/aggregate`,
    { method: 'POST', token },
  );
}

export function changeProjectStatus(
  id: string,
  status: string,
  token: string,
): Promise<ProjectSummary> {
  return apiRequest<ProjectSummary>(
    `/admin/carbon-projects/${id}/status`,
    { method: 'PATCH', body: { status }, token },
  );
}