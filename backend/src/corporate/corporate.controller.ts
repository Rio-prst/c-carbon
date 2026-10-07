import { Controller, Get } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

/**
 * Corporate reads only aggregates. Project lists and details are served by the
 * existing /carbon/projects endpoints, which already return the same aggregate
 * shape and already allow CORPORATE, so duplicating them here would create two
 * contracts for one dataset.
 */
@Controller('corporate')
@Roles('CORPORATE')
export class CorporateController {
  constructor(private readonly corporateService: CorporateService) {}

  @Get('overview')
  getOverview(@CurrentUser() user: JwtPayload) {
    return this.corporateService.getOverview(user.sub);
  }
}
