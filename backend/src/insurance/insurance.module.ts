import { Module } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { InsuranceController } from './insurance.controller';
import {
  INSURANCE_REPOSITORY,
  InsuranceRepository,
} from './insurance.repository';

@Module({
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
