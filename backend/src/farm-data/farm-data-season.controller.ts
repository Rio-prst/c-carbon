import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FarmDataSeasonService } from './farm-data-season.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('farms/:farmId/seasons')
export class FarmDataSeasonController {
  constructor(private readonly farmDataSeasonService: FarmDataSeasonService) {}

  @Post()
  @Roles('FARMER')
  createSeason(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataSeasonService.createSeason({
      farmId,
    });
  }

  @Get()
  @Roles('FARMER')
  getSeasons(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataSeasonService.getSeasonsByFarmId(farmId);
  }
}
