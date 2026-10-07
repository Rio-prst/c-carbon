import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FarmDataService } from './farm-data.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { CreateFarmDataDto } from './dto/create-farm-data.dto';
import { CreateFarmSeasonDto } from './dto/create-farm-season.dto';
import { UpdateFarmDataStatusDto } from './dto/update-farm-data-status.dto';

@Controller('farms/:farmId/data')
export class FarmDataController {
  constructor(private readonly farmDataService: FarmDataService) {}

  @Post()
  @Roles('FARMER', 'ADMIN')
  submitData(
    @Param('farmId') farmId: string,
    @Body() dto: CreateFarmDataDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataService.createData(user, farmId, {
      farmSeasonId: dto.farmSeasonId,
      yieldKg: dto.yieldKg,
      waterUsage: dto.waterUsage,
      fertilizerUsage: dto.fertilizerUsage,
      pesticideUsage: dto.pesticideUsage,
      wasteManagementPractice: dto.wasteManagementPractice,
      soilPractice: dto.soilPractice,
      energyUsage: dto.energyUsage,
      lowCarbonPractice: dto.lowCarbonPractice,
    });
  }

  @Get()
  @Roles('FARMER', 'ADMIN')
  getHistory(@Param('farmId') farmId: string, @CurrentUser() user: JwtPayload) {
    return this.farmDataService.getDataByFarmId(user, farmId);
  }

  @Patch(':id/status')
  @Roles('FARMER', 'ADMIN')
  updateStatus(
    @Param('farmId') farmId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFarmDataStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataService.updateDataStatus(
      user,
      farmId,
      id,
      dto.status,
      dto.rejectionReason,
    );
  }

  @Post('seasons')
  @Roles('FARMER', 'ADMIN')
  createSeason(
    @Param('farmId') farmId: string,
    @Body() dto: CreateFarmSeasonDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.farmDataService.createSeason(user, farmId, {
      seasonLabel: dto.seasonLabel,
      startDate: dto.startDate,
      endDate: dto.endDate,
      sequenceNumber: dto.sequenceNumber,
    });
  }

  @Get('seasons')
  @Roles('FARMER', 'ADMIN')
  getSeasons(@Param('farmId') farmId: string, @CurrentUser() user: JwtPayload) {
    return this.farmDataService.getSeasonsByFarmId(user, farmId);
  }
}
