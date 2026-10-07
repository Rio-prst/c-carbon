import { Controller, Get, Param, Post } from '@nestjs/common';
import { Body, HttpCode } from '@nestjs/common';
import { EvidenceService } from './evidence.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

@Controller('farms/:farmId/evidence')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post()
  @HttpCode(201)
  @Roles('FARMER', 'ADMIN')
  uploadEvidence(
    @Param('farmId') farmId: string,
    @Body() dto: CreateEvidenceDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.evidenceService.uploadEvidence(user, farmId, {
      farmDataId: dto.farmDataId,
      type: dto.type,
      url: dto.url,
      fileName: dto.fileName,
    });
  }

  @Get(':farmDataId')
  @Roles('FARMER', 'ADMIN')
  getEvidence(
    @Param('farmId') farmId: string,
    @Param('farmDataId') farmDataId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.evidenceService.getEvidenceByFarmDataId(
      user,
      farmId,
      farmDataId,
    );
  }
}
