import { Injectable } from '@nestjs/common';
import type { IFarmSeasonRepository } from './farm-data.repository.interface';
import { CreateFarmSeasonInput, FarmSeasonRecord } from './farm-data.repository.interface';

@Injectable()
export class FarmDataSeasonRepository implements IFarmSeasonRepository {
  private seasonMap: Map<string, FarmSeasonRecord> = new Map();

  async create(input: CreateFarmSeasonInput): Promise<FarmSeasonRecord> {
    const now = new Date();
    const season: FarmSeasonRecord = {
      id: crypto.randomUUID(),
      farmId: input.farmId,
      seasonLabel: input.seasonLabel,
      startDate: input.startDate,
      endDate: input.endDate,
      sequenceNumber: input.sequenceNumber,
      createdAt: now,
    };
    this.seasonMap.set(season.id, season);
    return season;
  }

  async findByFarmId(farmId: string): Promise<FarmSeasonRecord[]> {
    return Array.from(this.seasonMap.values()).filter(s => s.farmId === farmId);
  }

  async findById(id: string): Promise<FarmSeasonRecord | null> {
    return this.seasonMap.get(id) ?? null;
  }
}
