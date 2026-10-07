import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { FSSService } from './fss.service';
import { PlaceholderNormalizationProvider } from './placeholder-normalization.provider';
import { ScoreRepository } from './score.repository';
import { FSS_SERVICE } from './fss.service.interface';
import { NORMALIZATION_PROVIDER } from './normalization.provider.interface';
import { SCORE_REPOSITORY } from './score.repository.interface';
import { FarmsModule } from '../farms/farms.module';

@Module({
  imports: [FarmsModule],
  controllers: [ScoringController],
  providers: [
    ScoringService,
    { provide: FSS_SERVICE, useClass: FSSService },
    {
      provide: NORMALIZATION_PROVIDER,
      useClass: PlaceholderNormalizationProvider,
    },
    { provide: SCORE_REPOSITORY, useClass: ScoreRepository },
  ],
  exports: [ScoringService, SCORE_REPOSITORY],
})
export class ScoringModule {}
