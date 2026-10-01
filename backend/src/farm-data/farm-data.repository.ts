import { Injectable } from '@nestjs/common';
import { IFarmDataRepository } from './farm-data.repository.interface';
import { CreateFarmDataInput, FarmDataRecord, FarmDataStatus } from './farm-data.repository.interface';

@Injectable()
export class FarmDataRepository implements IFarmDataRepository {
  private dataMap: Map<string, FarmDataRecord> = new Map();

  async create(input: CreateFarmDataInput): Promise<FarmDataRecord> {
    const now = new Date();
    const data: FarmDataRecord = {
      id: crypto.randomUUID(),
      farmSeasonId: input.farmSeasonId,
      yieldKg: input.yieldKg,
      waterUsage: input.waterUsage,
      fertilizerUsage: input.fertilizerUsage,
      pesticideUsage: input.pesticideUsage,
      wasteManagementPractice: input.wasteManagementPractice,
      soilPractice: input.soilPractice,
      energyUsage: input.energyUsage,
      lowCarbonPractice: input.lowCarbonPractice ?? false,
      status: input.status ?? 'SELF_REPORTED',
      submittedAt: input.status ? now : undefined,
      createdAt: now,
    };
    this.dataMap.set(data.id, data);
    return data;
  }

  async findByFarmSeasonId(farmSeasonId: string): Promise<FarmDataRecord[]> {
    return Array.from(this.dataMap.values()).filter(d => d.farmSeasonId === farmSeasonId);
  }

  async findByFarmId(farmId: string): Promise<FarmDataRecord[]> {
    return [];
  }

  async findById(id: string): Promise<FarmDataRecord | null> {
    return this.dataMap.get(id) ?? null;
  }

  async updateStatus(id: string, status: FarmDataStatus): Promise<FarmDataRecord> {
    const data = this.dataMap.get(id);
    if (!data) {
      throw new Error('Farm data not found');
    }
    const updated: FarmDataRecord = {
      ...data,
      status,
      submittedAt: new Date(),
    };
    this.dataMap.set(id, updated);
    return updated;
  }
}
