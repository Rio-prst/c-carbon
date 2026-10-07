import { Inject, Injectable } from '@nestjs/common';
import {
  INSURANCE_REPOSITORY,
  type IInsuranceRepository,
  type InsuranceRecord,
} from './insurance.repository.interface';
import { FarmsService } from '../farms/farms.service';
import type { JwtPayload } from '../auth/types/jwt-payload';

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
    user: JwtPayload,
    farmId: string,
  ): Promise<InsuranceRecord | null> {
    await this.farmsService.resolveAccess(user, farmId);
    return this.insuranceRepository.findByFarmId(farmId);
  }
}
