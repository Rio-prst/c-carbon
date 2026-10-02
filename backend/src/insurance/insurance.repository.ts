import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

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

  findByFarmId(farmId: string): Promise<InsuranceRecord | null> {
    return Promise.resolve(this.insuranceMap.get(farmId) ?? null);
  }

  create(input: CreateInsuranceInput): Promise<InsuranceRecord> {
    const now = new Date();
    const insurance: InsuranceRecord = {
      id: randomUUID(),
      farmId: input.farmId,
      partner: input.partner,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    this.insuranceMap.set(input.farmId, insurance);
    return Promise.resolve(insurance);
  }
}
