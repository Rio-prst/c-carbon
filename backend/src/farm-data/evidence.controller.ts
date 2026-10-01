import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload')
  @Roles('FARMER')
  uploadEvidence(
    @Body() dto: { farmDataId: string; type?: string; url?: string; fileName?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.evidenceService.uploadEvidence({
      farmDataId: dto.farmDataId,
      type: dto.type,
      url: dto.url,
      fileName: dto.fileName,
    });
  }

  @Get(':farmDataId')
  @Roles('FARMER')
  getEvidence(
    @Param('farmDataId') farmDataId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.evidenceService.getEvidenceByFarmDataId(farmDataId);
  }
}
