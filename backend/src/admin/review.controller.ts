import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReviewService } from './review.service';
import { RejectFarmDataDto } from './dto/reject-farm-data.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload';

@Controller('admin')
@Roles('ADMIN')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('farm-data')
  getQueue(@CurrentUser() user: JwtPayload) {
    return this.reviewService.getQueue(user.sub);
  }

  @Post('farm-data/:id/verify')
  verify(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reviewService.verify(user.sub, id);
  }

  @Post('farm-data/:id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: RejectFarmDataDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewService.reject(user.sub, id, dto.rejectionReason);
  }

  @Patch('farm-data/:id/start-review')
  startReview(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.reviewService.startReview(user.sub, id);
  }

  @Get('audit-log')
  getAuditLog() {
    return this.reviewService.getAuditLog();
  }
}
