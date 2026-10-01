import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { CreateInsuranceDto } from './dto/create-insurance.dto';
import { InsuranceService } from './insurance.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get(':farmId')
  @Roles('FARMER')
  getInsurance(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.insuranceService.getInsurance(farmId);
  }

  @Post()
  @Roles('FARMER')
  create(
    @Body() dto: CreateInsuranceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.insuranceService.createInsurance(
      user.sub,
      dto.partner,
      dto.status,
    );
  }
}
