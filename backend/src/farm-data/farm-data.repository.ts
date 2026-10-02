import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateFarmDataInput,
  FarmDataRecord,
  FarmDataStatus,
  IFarmDataRepository,
} from './farm-data.repository.interface';

@Injectable()
export class FarmDataRepository implements IFarmDataRepository {
  private dataMap: Map<string, FarmDataRecord> = new Map();

  create(input: CreateFarmDataInput): Promise<FarmDataRecord> {
    const now = new Date();
    const data: FarmDataRecord = {
      id: randomUUID(),
      farmId: input.farmId,
      farmSeasonId: input.farmSeasonId,
      yieldKg: input.yieldKg,
      waterUsage: input.waterUsage,
      fertilizerUsage: input.fertilizerUsage,
      pesticideUsage: input.pesticideUsage,
      wasteManagementPractice: input.wasteManagementPractice,
      soilPractice: input.soilPractice,
      energyUsage: input.energyUsage,
      lowCarbonPractice: input.lowCarbonPractice ?? false,
      status: 'SELF_REPORTED',
      submittedAt: now,
      createdAt: now,
    };
    this.dataMap.set(data.id, data);
    return Promise.resolve(data);
  }

  findByFarmSeasonId(farmSeasonId: string): Promise<FarmDataRecord[]> {
    return Promise.resolve(
      Array.from(this.dataMap.values()).filter(
        (d) => d.farmSeasonId === farmSeasonId,
      ),
    );
  }

  findByFarmId(farmId: string): Promise<FarmDataRecord[]> {
    return Promise.resolve(
      Array.from(this.dataMap.values()).filter((d) => d.farmId === farmId),
    );
  }

  findById(id: string): Promise<FarmDataRecord | null> {
    return Promise.resolve(this.dataMap.get(id) ?? null);
  }

  updateStatus(id: string, status: FarmDataStatus): Promise<FarmDataRecord> {
    const data = this.dataMap.get(id);
    if (!data) {
      throw new Error(`Farm data ${id} not found`);
    }
    const updated: FarmDataRecord = { ...data, status };
    this.dataMap.set(id, updated);
    return Promise.resolve(updated);
  }
}
