import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { FSSService } from './fss.service';
import { ScoreRepository } from './score.repository';
import { FSS_SERVICE } from './fss.service.interface';
import { SCORE_REPOSITORY } from './score.repository.interface';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [FarmsModule],
  controllers: [ScoringController],
  providers: [
    ScoringService,
    { provide: FSS_SERVICE, useClass: FSSService },
    { provide: SCORE_REPOSITORY, useClass: ScoreRepository },
  ],
  exports: [ScoringService],
})
export class ScoringModule {}
