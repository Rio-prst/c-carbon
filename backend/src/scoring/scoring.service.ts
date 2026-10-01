import { Injectable } from '@nestjs/common';
import type { IFSSService, FSSInput, FSSResult, FSSBreakdown } from './fss.service.interface';
import type { IScoreRepository, CreateScoreInput, ScoreType } from './score.repository.interface';

@Injectable()
export class ScoringService {
  constructor(
    private readonly fssService: IFSSService,
    private readonly scoreRepository: IScoreRepository,
  ) {}

  async calculateFSS(
    farmId: string,
    farmData: FSSInput,
  ): Promise<FSSResult> {
    const result = this.fssService.calculateFSS(farmData);

    await this.scoreRepository.save({
      farmId,
      scoreType: 'FSS' as ScoreType,
      value: result.value,
      breakdown: result.breakdown,
      isProvisional: result.isProvisional,
    });

    return result;
  }

  async getFSS(farmId: string): Promise<FSSResult | null> {
    const score = await this.scoreRepository.findByFarmId(farmId, 'FSS' as ScoreType);
    if (!score) return null;

    return {
      value: score.value,
      breakdown: score.breakdown as unknown as FSSBreakdown,
      isProvisional: score.isProvisional,
    };
  }
}
