import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { FSSService } from './fss.service';
import { ScoreRepository } from './score.repository';
import {
  FSS_SERVICE,
  IFSSService,
} from './fss.service.interface';
import {
  FSS_REPOSITORY,
  IScoreRepository,
} from './score.repository.interface';

@Module({
  controllers: [ScoringController],
  providers: [
    ScoringService,
    FSSService,
    {
      provide: FSS_SERVICE,
      useClass: FSSService,
    },
    ScoreRepository,
    {
      provide: FSS_REPOSITORY,
      useClass: ScoreRepository,
    },
  ],
  exports: [ScoringService],
})
export class ScoringModule {}
