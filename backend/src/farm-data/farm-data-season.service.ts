import { Injectable } from '@nestjs/common';
import type { IFarmSeasonRepository } from './farm-data.repository.interface';
import { CreateFarmSeasonInput, FarmSeasonRecord } from './farm-data.repository.interface';

@Injectable()
export class FarmDataSeasonService {
  constructor(private readonly farmSeasonRepository: IFarmSeasonRepository) {}

  async createSeason(input: CreateFarmSeasonInput): Promise<FarmSeasonRecord> {
    return this.farmSeasonRepository.create(input);
  }

  async getSeasonsByFarmId(farmId: string): Promise<FarmSeasonRecord[]> {
    return this.farmSeasonRepository.findByFarmId(farmId);
  }

  async getSeasonById(id: string): Promise<FarmSeasonRecord | null> {
    return this.farmSeasonRepository.findById(id);
  }
}
