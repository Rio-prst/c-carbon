import { Module } from '@nestjs/common';
import { RewardController } from './reward.controller';
import { RewardService } from './reward.service';
import { RewardRepository } from './reward.repository';
import { REWARD_REPOSITORY } from './reward.repository.interface';

@Module({
  controllers: [RewardController],
  providers: [
    RewardService,
    RewardRepository,
    {
      provide: REWARD_REPOSITORY,
      useClass: RewardRepository,
    },
  ],
  exports: [RewardService, REWARD_REPOSITORY],
})
export class RewardModule {}
