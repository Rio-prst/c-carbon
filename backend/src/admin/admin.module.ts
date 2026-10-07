import { Module } from '@nestjs/common';
import { AuditLog } from './audit-log.service';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { FarmsModule } from '../farms/farms.module';
import { FarmDataModule } from '../farm-data/farm-data.module';
import { ScoringModule } from '../scoring/scoring.module';
import { RewardModule } from '../rewards/reward.module';

@Module({
  imports: [FarmsModule, FarmDataModule, ScoringModule, RewardModule],
  controllers: [ReviewController],
  providers: [ReviewService, AuditLog],
})
export class AdminModule {}
