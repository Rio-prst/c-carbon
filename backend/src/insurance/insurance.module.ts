import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import { INSURANCE_REPOSITORY } from './insurance.repository.interface';
import { InsuranceRepository } from './insurance.repository';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [FarmsModule],
  controllers: [InsuranceController],
  providers: [
    InsuranceService,
    {
      provide: INSURANCE_REPOSITORY,
      useClass: InsuranceRepository,
    },
  ],
  exports: [InsuranceService, INSURANCE_REPOSITORY],
})
export class InsuranceModule {}
