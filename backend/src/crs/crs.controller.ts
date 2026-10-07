import { Controller, Get, Param } from '@nestjs/common';
import { ReadinessService } from './readiness.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('farms/:farmId/readiness')
export class CRSController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get()
  @Roles('FARMER', 'ADMIN')
  getReadiness(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.readinessService.getReadiness(user, farmId);
  }
}
