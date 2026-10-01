import { Injectable } from '@nestjs/common';
import { FarmSeasonRepository } from './farm-season.repository';
import { CreateFarmSeasonInput, FarmSeasonRecord } from '../farm-data.repository.interface';

@Injectable()
export class FarmSeasonService {
  constructor(private readonly farmSeasonRepository: FarmSeasonRepository) {}

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
