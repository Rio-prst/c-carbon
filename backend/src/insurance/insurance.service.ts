import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  INSURANCE_REPOSITORY,
  type CreateInsuranceInput,
  type InsuranceRecord,
  type IInsuranceRepository,
  type InsuranceStatus,
} from './insurance.repository.interface';

@Injectable()
export class InsuranceService {
  constructor(
    @Inject(INSURANCE_REPOSITORY)
    private readonly insuranceRepository: IInsuranceRepository,
  ) {}

  async getInsurance(farmId: string): Promise<InsuranceRecord | null> {
    return this.insuranceRepository.findByFarmId(farmId);
  }

  async createInsurance(
    farmId: string,
    partner: string,
    status: InsuranceStatus = 'PENDING',
  ): Promise<InsuranceRecord> {
    return this.insuranceRepository.create({
      farmId,
      partner,
      status,
    });
  }
}
