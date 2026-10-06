import { Module } from '@nestjs/common';
import { FarmDataModule } from '../farm-data/farm-data.module';
import { FarmsModule } from '../farms/farms.module';
import { InsuranceModule } from '../insurance/insurance.module';
import { RewardModule } from '../rewards/reward.module';
import { ScoringModule } from '../scoring/scoring.module';
import { UsersModule } from '../users/users.module';
import { DemoSeedService } from './demo-seed.service';

/**
 * Mounted last so the repositories it writes to are already resolved.
 */
@Module({
  imports: [
    UsersModule,
    FarmsModule,
    FarmDataModule,
    InsuranceModule,
    ScoringModule,
    RewardModule,
  ],
  providers: [DemoSeedService],
})
export class DemoSeedModule {}
