import { apiRequest, apiUpload } from '../lib/api';
import type {
  CreateSeasonInput,
  Evidence,
  FarmData,
  FarmSeason,
  SubmitFarmDataInput,
} from '../types/farm-data';

export function getSeasons(farmId: string, token: string): Promise<FarmSeason[]> {
  return apiRequest<FarmSeason[]>(`/farms/${farmId}/data/seasons`, { token });
}

export function createSeason(
  farmId: string,
  input: CreateSeasonInput,
  token: string,
): Promise<FarmSeason> {
  return apiRequest<FarmSeason>(`/farms/${farmId}/data/seasons`, {
    method: 'POST',
    body: input,
    token,
  });
}

export function getHistory(farmId: string, token: string): Promise<FarmData[]> {
  return apiRequest<FarmData[]>(`/farms/${farmId}/data`, { token });
}

export function submitData(
  farmId: string,
  input: SubmitFarmDataInput,
  token: string,
): Promise<FarmData> {
  return apiRequest<FarmData>(`/farms/${farmId}/data`, {
    method: 'POST',
    body: input,
    token,
  });
}

export function getEvidence(
  farmId: string,
  farmDataId: string,
  token: string,
): Promise<Evidence[]> {
  return apiRequest<Evidence[]>(`/farms/${farmId}/evidence/${farmDataId}`, {
    token,
  });
}

export function addEvidence(
  farmId: string,
  input: { farmDataId: string; type?: string; url?: string; fileName?: string },
  token: string,
): Promise<Evidence> {
  return apiRequest<Evidence>(`/farms/${farmId}/evidence`, {
    method: 'POST',
    body: input,
    token,
  });
}

/**
 * Uploads the file itself, not just its name.
 *
 * React Native's FormData accepts the local file shape directly, so the bytes
 * are streamed by the runtime rather than read into memory and base64 encoded.
 */
export function uploadEvidenceFile(
  farmId: string,
  farmDataId: string,
  file: { uri: string; name: string; type: string },
  token: string,
): Promise<Evidence> {
  const form = new FormData();
  form.append('file', file as unknown as Blob);

  return apiUpload<Evidence>(
    `/farms/${farmId}/evidence/${farmDataId}/upload`,
    form,
    token,
  );
}