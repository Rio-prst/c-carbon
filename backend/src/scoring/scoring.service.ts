import { Inject, Injectable } from '@nestjs/common';
import {
  FSS_SERVICE,
  type FSSInput,
  type FSSResult,
  type IFSSService,
} from './fss.service.interface';
import {
  SCORE_REPOSITORY,
  type IScoreRepository,
} from './score.repository.interface';
import { FarmsService } from '../farms/farms.service';

export type FarmScoreResponse = {
  fss_value: number;
  is_provisional: boolean;
  breakdown: Record<string, number>;
};

@Injectable()
export class ScoringService {
  constructor(
    @Inject(FSS_SERVICE)
    private readonly fssService: IFSSService,
    @Inject(SCORE_REPOSITORY)
    private readonly scoreRepository: IScoreRepository,
    private readonly farmsService: FarmsService,
  ) {}

  /**
   * Recalculates the provisional FSS after farm data changes.
   * Called by FarmDataService; not exposed as a public endpoint because
   * score recalculation is a side effect of data submission, not a farmer action.
   */
  async recalculateFromFarmData(
    userId: string,
    farmId: string,
    farmData: FSSInput,
  ): Promise<FarmScoreResponse> {
    const result = this.fssService.calculateFSS(farmData);

    await this.scoreRepository.save({
      farmId,
      scoreType: 'FSS',
      value: result.value,
      breakdown: result.breakdown,
      isProvisional: result.isProvisional,
    });

    return this.serializeScore(result);
  }

  async getScore(
    userId: string,
    farmId: string,
  ): Promise<FarmScoreResponse | null> {
    await this.farmsService.assertOwnership(userId, farmId);

    const score = await this.scoreRepository.findByFarmId(farmId, 'FSS');
    if (!score) return null;

    return this.serializeScore({
      value: score.value,
      breakdown: score.breakdown,
      isProvisional: score.isProvisional,
    });
  }

  private serializeScore(result: FSSResult): FarmScoreResponse {
    return {
      fss_value: result.value,
      is_provisional: result.isProvisional,
      breakdown: { ...result.breakdown },
    };
  }
}
