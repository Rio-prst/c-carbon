export const INSURANCE_REPOSITORY = Symbol('INSURANCE_REPOSITORY');

export type InsuranceStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED';

export type CreateInsuranceInput = {
  farmId: string;
  partner: string;
  status: InsuranceStatus;
};

export type InsuranceRecord = {
  id: string;
  farmId: string;
  partner: string;
  status: InsuranceStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface IInsuranceRepository {
  findByFarmId(farmId: string): Promise<InsuranceRecord | null>;

  create(input: CreateInsuranceInput): Promise<InsuranceRecord>;
}
