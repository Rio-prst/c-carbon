export type FarmDataStatus =
  | 'SELF_REPORTED'
  | 'REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type FarmSeason = {
  id: string;
  farmId: string;
  seasonLabel?: string;
  startDate?: string;
  endDate?: string;
  sequenceNumber?: number;
  createdAt: string;
};

export type FarmData = {
  id: string;
  farmId: string;
  farmSeasonId: string;
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
  pesticideUsage?: number;
  wasteManagementPractice?: string;
  soilPractice?: string;
  energyUsage?: number;
  lowCarbonPractice: boolean;
  status: FarmDataStatus;
  rejectionReason?: string;
  submittedAt: string;
  createdAt: string;
};

export type Evidence = {
  id: string;
  farmDataId: string;
  type?: string;
  url?: string;
  fileName?: string;
  uploadedAt: string;
};

export type CreateSeasonInput = {
  seasonLabel?: string;
  startDate?: string;
  endDate?: string;
  sequenceNumber?: number;
};

export type SubmitFarmDataInput = {
  farmSeasonId: string;
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
  pesticideUsage?: number;
  wasteManagementPractice?: string;
  soilPractice?: string;
  energyUsage?: number;
  lowCarbonPractice?: boolean;
};