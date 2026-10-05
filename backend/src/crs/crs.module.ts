import { Module } from '@nestjs/common';
import { CRSService } from './crs.service';
import { PracticeEligibilityProvider } from './practice-eligibility.provider';
import { ReadinessService } from './readiness.service';
import { CRSController } from './crs.controller';
import { CRS_SERVICE } from './crs.service.interface';
import { PRACTICE_ELIGIBILITY_PROVIDER } from './practice-eligibility.provider.interface';
import { FarmsModule } from '../farms/farms.module';
import { FarmDataModule } from '../farm-data/farm-data.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [FarmsModule, FarmDataModule, ScoringModule],
  controllers: [CRSController],
  providers: [
    ReadinessService,
    { provide: CRS_SERVICE, useClass: CRSService },
    {
      provide: PRACTICE_ELIGIBILITY_PROVIDER,
      useClass: PracticeEligibilityProvider,
    },
  ],
  exports: [ReadinessService],
})
export class CRSModule {}
