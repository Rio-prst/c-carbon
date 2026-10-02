import { Inject, Injectable } from '@nestjs/common';
import {
  INSURANCE_REPOSITORY,
  type IInsuranceRepository,
  type InsuranceRecord,
} from './insurance.repository.interface';
import { FarmsService } from '../farms/farms.service';

@Injectable()
export class InsuranceService {
  constructor(
    @Inject(INSURANCE_REPOSITORY)
    private readonly insuranceRepository: IInsuranceRepository,
    private readonly farmsService: FarmsService,
  ) {}

  /**
   * Insurance is read-only for farmers in MVP, so the farmer can only read the
   * record of a farm they own.
   */
  async getInsurance(
    userId: string,
    farmId: string,
  ): Promise<InsuranceRecord | null> {
    await this.farmsService.assertOwnership(userId, farmId);
    return this.insuranceRepository.findByFarmId(farmId);
  }
}
