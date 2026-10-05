import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  FARM_DATA_REPOSITORY,
  FARM_SEASON_REPOSITORY,
  type CreateFarmDataInput,
  type CreateFarmSeasonInput,
  type FarmDataRecord,
  type FarmDataStatus,
  type FarmSeasonRecord,
  type IFarmDataRepository,
  type IFarmSeasonRepository,
} from './farm-data.repository.interface';
import { FarmsService } from '../farms/farms.service';
import { ScoringService } from '../scoring/scoring.service';

@Injectable()
export class FarmDataService {
  constructor(
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    @Inject(FARM_SEASON_REPOSITORY)
    private readonly farmSeasonRepository: IFarmSeasonRepository,
    private readonly farmsService: FarmsService,
    private readonly scoringService: ScoringService,
  ) {}

  /**
   * Records a self-reported submission and recalculates the provisional FSS.
   * Ownership of the farm and the season is enforced here, not in the UI.
   */
  async createData(
    userId: string,
    farmId: string,
    input: Omit<CreateFarmDataInput, 'farmId'>,
  ): Promise<FarmDataRecord> {
    await this.farmsService.assertOwnership(userId, farmId);
    await this.assertSeasonOwnership(farmId, input.farmSeasonId);

    const data = await this.farmDataRepository.create({ ...input, farmId });
    await this.scoringService.recalculateFromFarmData(userId, farmId, {
      ...data,
      farmDataStatus: data.status,
    });
    return data;
  }

  async getDataByFarmId(
    userId: string,
    farmId: string,
  ): Promise<FarmDataRecord[]> {
    await this.farmsService.assertOwnership(userId, farmId);
    return this.farmDataRepository.findByFarmId(farmId);
  }

  async getDataByFarmSeasonId(
    userId: string,
    farmId: string,
    farmSeasonId: string,
  ): Promise<FarmDataRecord[]> {
    await this.farmsService.assertOwnership(userId, farmId);
    await this.assertSeasonOwnership(farmId, farmSeasonId);
    return this.farmDataRepository.findByFarmSeasonId(farmSeasonId);
  }

  async createSeason(
    userId: string,
    farmId: string,
    input: Omit<CreateFarmSeasonInput, 'farmId'>,
  ): Promise<FarmSeasonRecord> {
    await this.farmsService.assertOwnership(userId, farmId);
    return this.farmSeasonRepository.create({ ...input, farmId });
  }

  async getSeasonsByFarmId(
    userId: string,
    farmId: string,
  ): Promise<FarmSeasonRecord[]> {
    await this.farmsService.assertOwnership(userId, farmId);
    return this.farmSeasonRepository.findByFarmId(farmId);
  }

  async updateDataStatus(
    userId: string,
    farmId: string,
    id: string,
    status: FarmDataStatus,
    rejectionReason?: string,
  ): Promise<FarmDataRecord> {
    await this.farmsService.assertOwnership(userId, farmId);

    const data = await this.farmDataRepository.findById(id);
    if (!data || data.farmId !== farmId) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'FARM_DATA_NOT_FOUND',
        message: 'Farm data not found',
        details: {},
      });
    }

    const updated = await this.farmDataRepository.updateStatus(
      id,
      status,
      rejectionReason,
    );
    await this.scoringService.recalculateFromFarmData(userId, farmId, {
      ...updated,
      farmDataStatus: updated.status,
    });
    return updated;
  }

  private async assertSeasonOwnership(
    farmId: string,
    farmSeasonId: string,
  ): Promise<void> {
    const season = await this.farmSeasonRepository.findById(farmSeasonId);
    if (!season || season.farmId !== farmId) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'FARM_SEASON_NOT_FOUND',
        message: 'Farm season not found',
        details: {},
      });
    }
  }
}
