import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateFarmSeasonInput,
  FarmSeasonRecord,
  IFarmSeasonRepository,
} from './farm-data.repository.interface';

@Injectable()
export class FarmSeasonRepository implements IFarmSeasonRepository {
  private seasonMap: Map<string, FarmSeasonRecord> = new Map();

  create(input: CreateFarmSeasonInput): Promise<FarmSeasonRecord> {
    const season: FarmSeasonRecord = {
      id: randomUUID(),
      farmId: input.farmId,
      seasonLabel: input.seasonLabel,
      startDate: input.startDate,
      endDate: input.endDate,
      sequenceNumber: input.sequenceNumber,
      createdAt: new Date(),
    };
    this.seasonMap.set(season.id, season);
    return Promise.resolve(season);
  }

  findByFarmId(farmId: string): Promise<FarmSeasonRecord[]> {
    return Promise.resolve(
      Array.from(this.seasonMap.values()).filter((s) => s.farmId === farmId),
    );
  }

  findById(id: string): Promise<FarmSeasonRecord | null> {
    return Promise.resolve(this.seasonMap.get(id) ?? null);
  }
}
