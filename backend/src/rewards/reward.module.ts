import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { RewardRepository } from './reward.repository';
import { REWARD_REPOSITORY } from './reward.repository.interface';

@Module({
  controllers: [RewardController],
  providers: [
    RewardService,
    // Registered under the token only: a second registration under the class
    // token would build a second repository instance with its own state.
    {
      provide: REWARD_REPOSITORY,
      useClass: RewardRepository,
    },
  ],
  exports: [RewardService, REWARD_REPOSITORY],
})
export class RewardModule {}
