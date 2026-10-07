import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
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
import { RewardService } from '../rewards/reward.service';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Injectable()
export class FarmDataService {
  private readonly logger = new Logger(FarmDataService.name);

  constructor(
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    @Inject(FARM_SEASON_REPOSITORY)
    private readonly farmSeasonRepository: IFarmSeasonRepository,
    private readonly farmsService: FarmsService,
    private readonly scoringService: ScoringService,
    private readonly rewardService: RewardService,
  ) {}

  /**
   * Records a self-reported submission and recalculates the provisional FSS.
   * Ownership of the farm and the season is enforced here, not in the UI.
   */
  async createData(
    user: JwtPayload,
    farmId: string,
    input: Omit<CreateFarmDataInput, 'farmId'>,
  ): Promise<FarmDataRecord> {
    const farm = await this.farmsService.resolveAccess(user, farmId);
    await this.assertSeasonOwnership(farmId, input.farmSeasonId);

    const data = await this.farmDataRepository.create({ ...input, farmId });
    // Score and reward always follow the farm owner, never the requester. An
    // admin submitting on a farmer's behalf must not collect their points.
    await this.scoringService.recalculateFromFarmData(farm.userId, farmId, {
      ...data,
      farmDataStatus: data.status,
    });
    await this.awardSubmissionReward(farm.userId, data);
    return data;
  }

  async getDataByFarmId(
    user: JwtPayload,
    farmId: string,
  ): Promise<FarmDataRecord[]> {
    await this.farmsService.resolveAccess(user, farmId);
    return this.farmDataRepository.findByFarmId(farmId);
  }

  async getDataByFarmSeasonId(
    user: JwtPayload,
    farmId: string,
    farmSeasonId: string,
  ): Promise<FarmDataRecord[]> {
    await this.farmsService.resolveAccess(user, farmId);
    await this.assertSeasonOwnership(farmId, farmSeasonId);
    return this.farmDataRepository.findByFarmSeasonId(farmSeasonId);
  }

  async createSeason(
    user: JwtPayload,
    farmId: string,
    input: Omit<CreateFarmSeasonInput, 'farmId'>,
  ): Promise<FarmSeasonRecord> {
    await this.farmsService.resolveAccess(user, farmId);
    return this.farmSeasonRepository.create({ ...input, farmId });
  }

  async getSeasonsByFarmId(
    user: JwtPayload,
    farmId: string,
  ): Promise<FarmSeasonRecord[]> {
    await this.farmsService.resolveAccess(user, farmId);
    return this.farmSeasonRepository.findByFarmId(farmId);
  }

  async updateDataStatus(
    user: JwtPayload,
    farmId: string,
    id: string,
    status: FarmDataStatus,
    rejectionReason?: string,
  ): Promise<FarmDataRecord> {
    const farm = await this.farmsService.resolveAccess(user, farmId);

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
    await this.scoringService.recalculateFromFarmData(farm.userId, farmId, {
      ...updated,
      farmDataStatus: updated.status,
    });
    return updated;
  }

  /**
   * A reward must never cost the farmer their data submission, so a failure
   * here is logged rather than propagated.
   */
  private async awardSubmissionReward(
    userId: string,
    data: FarmDataRecord,
  ): Promise<void> {
    try {
      await this.rewardService.awardEvent(userId, 'FARM_DATA_SUBMISSION', {
        description: `Data submission for farm ${data.farmId}`,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Could not award submission reward for user ${userId}: ${String(error)}`,
      );
    }
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
