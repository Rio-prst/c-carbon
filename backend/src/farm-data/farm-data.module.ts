import { Module } from '@nestjs/common';
import { FarmDataService } from './farm-data.service';
import { FarmDataController } from './farm-data.controller';
import { FarmDataRepository } from './farm-data.repository';
import { FarmDataSeasonService } from './farm-data-season.service';
import { FarmDataSeasonController } from './farm-data-season.controller';
import { FarmDataSeasonRepository } from './farm-data-season.repository';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { EvidenceRepository } from './evidence.repository';

@Module({
  controllers: [
    FarmDataController,
    FarmDataSeasonController,
    EvidenceController,
  ],
  providers: [
    FarmDataService,
    FarmDataSeasonService,
    EvidenceService,
    FarmDataRepository,
    FarmDataSeasonRepository,
    EvidenceRepository,
  ],
  exports: [FarmDataService, FarmDataSeasonService, EvidenceService],
})
export class FarmDataModule {}
