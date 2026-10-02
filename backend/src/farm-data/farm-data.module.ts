import { Module } from '@nestjs/common';
import { FarmDataService } from './farm-data.service';
import { FarmDataController } from './farm-data.controller';
import { FarmDataRepository } from './farm-data.repository';
import { FarmSeasonRepository } from './farm-season.repository';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { EvidenceRepository } from './evidence.repository';
import {
  EVIDENCE_REPOSITORY,
  FARM_DATA_REPOSITORY,
  FARM_SEASON_REPOSITORY,
} from './farm-data.repository.interface';
import { FarmsModule } from '../farms/farms.module';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [FarmsModule, ScoringModule],
  controllers: [FarmDataController, EvidenceController],
  providers: [
    FarmDataService,
    { provide: FARM_DATA_REPOSITORY, useClass: FarmDataRepository },
    { provide: FARM_SEASON_REPOSITORY, useClass: FarmSeasonRepository },
    EvidenceService,
    { provide: EVIDENCE_REPOSITORY, useClass: EvidenceRepository },
  ],
  exports: [FarmDataService, EvidenceService],
})
export class FarmDataModule {}
