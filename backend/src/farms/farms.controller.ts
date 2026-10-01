import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  /** Registers a new farm owned by the authenticated farmer. */
  @Post()
  @Roles('FARMER')
  create(@Body() dto: CreateFarmDto, @CurrentUser() user: JwtPayload) {
    return this.farmsService.createFarm(user.sub, dto);
  }

  /** Lists farms owned by the authenticated farmer. */
  @Get()
  @Roles('FARMER')
  list(@CurrentUser() user: JwtPayload) {
    return this.farmsService.listFarms(user.sub);
  }

  /** Returns a single farm owned by the authenticated farmer. */
  @Get(':id')
  @Roles('FARMER')
  get(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.farmsService.getFarm(user.sub, id);
  }
}
