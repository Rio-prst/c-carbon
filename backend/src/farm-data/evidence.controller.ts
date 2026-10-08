import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile as Uploaded,
  UseInterceptors,
} from '@nestjs/common';
import { Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  /**
   * Multipart upload carrying the actual bytes.
   *
   * A storage failure answers 503 so the client can tell it apart from a
   * validation problem and keep the submission either way.
   */
  @Post(':farmDataId/upload')
  @HttpCode(201)
  @Roles('FARMER', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadEvidenceFile(
    @Param('farmId') farmId: string,
    @Param('farmDataId') farmDataId: string,
    @Uploaded() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    if (!file) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'EVIDENCE_FILE_REQUIRED',
        message: 'An evidence file is required',
        details: {},
      });
    }

    const outcome = await this.evidenceService.uploadEvidenceFile(
      user,
      farmId,
      farmDataId,
      {
        originalName: file.originalname,
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size,
      },
    );

    if (!outcome.ok) {
      const status = outcome.reason === 'storage_unavailable' ? 503 : 400;
      throw new BadRequestException({
        statusCode: status,
        code: `EVIDENCE_${outcome.reason.toUpperCase()}`,
        message: outcome.message,
        details: {},
      });
    }

    return outcome.evidence;
  }
}
