import { Injectable } from '@nestjs/common';
import type { IFarmDataRepository } from './farm-data.repository.interface';
import { CreateFarmDataInput, FarmDataRecord, FarmDataStatus } from './farm-data.repository.interface';

@Injectable()
export class FarmDataService {
  constructor(private readonly farmDataRepository: IFarmDataRepository) {}

  async createData(input: CreateFarmDataInput): Promise<FarmDataRecord> {
    return this.farmDataRepository.create(input);
  }

  async getDataByFarmSeasonId(farmSeasonId: string): Promise<FarmDataRecord[]> {
    return this.farmDataRepository.findByFarmSeasonId(farmSeasonId);
  }

  async getDataById(id: string): Promise<FarmDataRecord | null> {
    return this.farmDataRepository.findById(id);
  }

  async getDataByFarmId(farmId: string): Promise<FarmDataRecord[]> {
    return this.farmDataRepository.findByFarmId(farmId);
  }

  async updateStatus(id: string, status: FarmDataStatus): Promise<FarmDataRecord> {
    return this.farmDataRepository.updateStatus(id, status);
  }
}
