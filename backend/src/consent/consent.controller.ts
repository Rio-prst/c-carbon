import { Body, Controller, Get, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ConsentService } from './consent.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

export const revokeConsentSchema = z.object({
  purpose: z.string().trim().min(1).max(50),
});

export class RevokeConsentDto extends createZodDto(revokeConsentSchema) {}

/**
 * Farmer-facing consent record. Corporate and admin have no consent to manage;
 * their access is not derived from farmer data.
 */
@Controller('consent')
@Roles('FARMER')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  @Get()
  getConsents(@CurrentUser() user: JwtPayload) {
    return this.consentService.getConsents(user.sub);
  }

  @Post('revoke')
  revoke(@Body() dto: RevokeConsentDto, @CurrentUser() user: JwtPayload) {
    return this.consentService.revoke(user.sub, dto.purpose);
  }
}
