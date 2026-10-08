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

export const grantConsentSchema = z.object({
  purpose: z.string().trim().min(1).max(50),
});

export class GrantConsentDto extends createZodDto(grantConsentSchema) {}

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

  /**
   * Grants again after a withdrawal.
   *
   * Without this, revoking would be a one-way door: the farmer could change
   * their mind in the app but not change it back, and reversing it would need
   * someone with database access. The new grant is appended rather than
   * overwriting, so the earlier withdrawal stays on record.
   */
  @Post('grant')
  grant(@Body() dto: GrantConsentDto, @CurrentUser() user: JwtPayload) {
    return this.consentService.grant(user.sub, dto.purpose);
  }
}
