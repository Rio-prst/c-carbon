import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  EVIDENCE_REPOSITORY,
  type CreateEvidenceInput,
  type EvidenceRecord,
  type IEvidenceRepository,
} from './farm-data.repository.interface';
import {
  FARM_DATA_REPOSITORY,
  type IFarmDataRepository,
} from './farm-data.repository.interface';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class EvidenceService {
  constructor(
    @Inject(EVIDENCE_REPOSITORY)
    private readonly evidenceRepository: IEvidenceRepository,
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    private readonly farmsService: FarmsService,
  ) {}

  async uploadEvidence(
    userId: string,
    farmId: string,
    input: CreateEvidenceInput,
  ): Promise<EvidenceRecord> {
    await this.farmsService.assertOwnership(userId, farmId);
    await this.assertFarmDataOwnership(farmId, input.farmDataId);
    return this.evidenceRepository.create(input);
  }

  async getEvidenceByFarmDataId(
    userId: string,
    farmId: string,
    farmDataId: string,
  ): Promise<EvidenceRecord[]> {
    await this.farmsService.assertOwnership(userId, farmId);
    await this.assertFarmDataOwnership(farmId, farmDataId);
    return this.evidenceRepository.findByFarmDataId(farmDataId);
  }

  private async assertFarmDataOwnership(
    farmId: string,
    farmDataId: string,
  ): Promise<void> {
    const data = await this.farmDataRepository.findById(farmDataId);
    if (!data || data.farmId !== farmId) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'FARM_DATA_NOT_FOUND',
        message: 'Farm data not found',
        details: {},
      });
    }
  }
}
