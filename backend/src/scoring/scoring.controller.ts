import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('farms/:farmId/score')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Post()
  @Roles('FARMER')
  calculateScore(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scoringService.calculateFSS(farmId, {
      farmDataStatus: 'SELF_REPORTED',
    });
  }

  @Get()
  @Roles('FARMER')
  getScore(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.scoringService.getFSS(farmId);
  }
}
