import { Controller, Get, Param } from '@nestjs/common';
import { InsuranceService } from './insurance.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('farms/:farmId/insurance')
export class InsuranceController {
  constructor(private readonly insuranceService: InsuranceService) {}

  @Get()
  @Roles('FARMER', 'ADMIN')
  getInsurance(
    @Param('farmId') farmId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.insuranceService.getInsurance(user, farmId);
  }
}
