import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { RewardService } from './reward.service';
import { CreateRewardEventDto } from './dto/create-reward-event.dto';

@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Get()
  @Roles('FARMER', 'ADMIN')
  async getRewards(@CurrentUser() user: JwtPayload) {
    return this.rewardService.getRewardsSummary(user.sub);
  }

  @Post('events')
  @Roles('ADMIN')
  async recordEvent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRewardEventDto,
  ) {
    const targetUserId = dto.user_id ?? user.sub;
    return this.rewardService.awardEvent(targetUserId, dto.event_type, {
      points: dto.points,
      description: dto.description,
    });
  }
}
