import { Controller, Get, Param } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('farms/:farmId/score')
export class ScoringController {
  constructor(private readonly scoringService: ScoringService) {}

  @Get()
  @Roles('FARMER', 'ADMIN')
  getScore(@Param('farmId') farmId: string, @CurrentUser() user: JwtPayload) {
    return this.scoringService.getScore(user.sub, farmId);
  }
}
