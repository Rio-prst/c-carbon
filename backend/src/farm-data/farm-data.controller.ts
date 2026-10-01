import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FarmDataService } from './farm-data.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { CreateFarmDataDto } from './dto/create-farm-data.dto';

@Controller('farms/:farmId/data')
export class FarmDataController {
  constructor(private readonly farmDataService: FarmDataService) {}

  @Post()
  @Roles('FARMER')
  submitData(
    @Param('farmId') farmId: string,
    @Body() dto: CreateFarmDataDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataService.createData({
      ...dto,
      farmSeasonId: dto.farmSeasonId,
    });
  }

  @Get()
  @Roles('FARMER')
  getHistory(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataService.getDataByFarmId(farmId);
  }
}
