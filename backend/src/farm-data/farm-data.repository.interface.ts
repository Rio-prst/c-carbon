export const FARM_SEASON_REPOSITORY = Symbol('FARM_SEASON_REPOSITORY');
export const FARM_DATA_REPOSITORY = Symbol('FARM_DATA_REPOSITORY');
export const EVIDENCE_REPOSITORY = Symbol('EVIDENCE_REPOSITORY');

export type FarmDataStatus = 'SELF_REPORTED' | 'REVIEW' | 'VERIFIED' | 'REJECTED';

export type CreateFarmSeasonInput = {
  farmId: string;
  seasonLabel?: string;
  startDate?: Date;
  endDate?: Date;
  sequenceNumber?: number;
};

export type CreateFarmDataInput = {
  farmSeasonId: string;
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
  pesticideUsage?: number;
  wasteManagementPractice?: string;
  soilPractice?: string;
  energyUsage?: number;
  lowCarbonPractice?: boolean;
  status?: FarmDataStatus;
};

export type CreateEvidenceInput = {
  farmDataId: string;
  type?: string;
  url?: string;
  fileName?: string;
};

export type FarmSeasonRecord = {
  id: string;
  farmId: string;
  seasonLabel?: string;
  startDate?: Date;
  endDate?: Date;
  sequenceNumber?: number;
  createdAt: Date;
};

export type FarmDataRecord = {
  id: string;
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
  submittedAt?: Date;
  createdAt: Date;
};

export type EvidenceRecord = {
  id: string;
  farmDataId: string;
  type?: string;
  url?: string;
  fileName?: string;
  uploadedAt: Date;
};

export interface IFarmSeasonRepository {
  create(input: CreateFarmSeasonInput): Promise<FarmSeasonRecord>;
  
  findByFarmId(farmId: string): Promise<FarmSeasonRecord[]>;
  
  findById(id: string): Promise<FarmSeasonRecord | null>;
}

export interface IFarmDataRepository {
  create(input: CreateFarmDataInput): Promise<FarmDataRecord>;
  
  findByFarmSeasonId(farmSeasonId: string): Promise<FarmDataRecord[]>;
  
  findByFarmId(farmId: string): Promise<FarmDataRecord[]>;
  
  findById(id: string): Promise<FarmDataRecord | null>;
  
  updateStatus(id: string, status: FarmDataStatus): Promise<FarmDataRecord>;
}

export interface IEvidenceRepository {
  create(input: CreateEvidenceInput): Promise<EvidenceRecord>;
  
  findByFarmDataId(farmDataId: string): Promise<EvidenceRecord[]>;
}
