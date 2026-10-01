import { Injectable } from '@nestjs/common';

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

@Injectable()
export class InsuranceRepository implements IInsuranceRepository {
  private insuranceMap: Map<string, InsuranceRecord> = new Map();

  async findByFarmId(farmId: string): Promise<InsuranceRecord | null> {
    return this.insuranceMap.get(farmId) ?? null;
  }

  async create(input: CreateInsuranceInput): Promise<InsuranceRecord> {
    const now = new Date();
    const insurance: InsuranceRecord = {
      id: crypto.randomUUID(),
      farmId: input.farmId,
      partner: input.partner,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    this.insuranceMap.set(input.farmId, insurance);
    return insurance;
  }
}
