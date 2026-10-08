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
  /**
   * Short-lived link to the stored file, issued per read. Absent when the
   * record predates file storage or the file could not be read, so the UI must
   * treat it as optional rather than assuming every entry is openable.
   */
  downloadUrl?: string;
  sizeBytes?: number;
  contentType?: string;
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