import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FARM_DATA_REPOSITORY,
  type FarmDataRecord,
  type IFarmDataRepository,
} from '../farm-data/farm-data.repository.interface';
import {
  EVIDENCE_REPOSITORY,
  type IEvidenceRepository,
} from '../farm-data/farm-data.repository.interface';
import { FarmsService } from '../farms/farms.service';
import { ScoringService } from '../scoring/scoring.service';
import { RewardService } from '../rewards/reward.service';
import { AuditLog } from './audit-log.service';
import type { ReviewQueueItem } from './dto/review-queue-item.dto';

/**
 * Admin review of farmer submissions.
 *
 * Every action here is a sensitive mutation: it changes a farmer's data
 * status, so each one writes an audit record and triggers a score
 * recalculation. Admins are deliberately not allowed to review their own
 * submissions, since there is no separation of duties in MVP.
 */
@Injectable()
export class ReviewService {
  constructor(
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    @Inject(EVIDENCE_REPOSITORY)
    private readonly evidenceRepository: IEvidenceRepository,
    private readonly farmsService: FarmsService,
    private readonly scoringService: ScoringService,
    private readonly rewardService: RewardService,
    private readonly auditLog: AuditLog,
  ) {}

  async getQueue(adminId: string): Promise<ReviewQueueItem[]> {
    const all = await this.farmDataRepository.findAll();
    const pending = all.filter((data) => data.status !== 'VERIFIED');

    const items: ReviewQueueItem[] = [];
    for (const data of pending) {
      const farm = await this.farmsService.findByIdForAdmin(data.farmId);
      if (!farm) continue;
      // Do not let an admin review their own submission.
      if (farm.userId === adminId) continue;

      const evidence = await this.evidenceRepository.findByFarmDataId(data.id);

      items.push({
        id: data.id,
        farmId: data.farmId,
        farmName: farm.name,
        digitalFarmId: farm.digitalFarmId,
        commodity: farm.commodity,
        farmSeasonId: data.farmSeasonId,
        submittedAt: data.submittedAt.toISOString(),
        status: data.status,
        yieldKg: data.yieldKg,
        waterUsage: data.waterUsage,
        fertilizerUsage: data.fertilizerUsage,
        pesticideUsage: data.pesticideUsage,
        energyUsage: data.energyUsage,
        wasteManagementPractice: data.wasteManagementPractice,
        soilPractice: data.soilPractice,
        lowCarbonPractice: data.lowCarbonPractice,
        evidenceCount: evidence.length,
      });
    }

    return items.sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );
  }

  async verify(adminId: string, farmDataId: string): Promise<FarmDataRecord> {
    const data = await this.assertReviewable(adminId, farmDataId);
    const farmOwnerId = await this.getFarmOwnerId(data.farmId);

    const updated = await this.farmDataRepository.updateStatus(
      data.id,
      'VERIFIED',
    );

    await this.scoringService.recalculateFromFarmData(
      farmOwnerId,
      data.farmId,
      {
        ...updated,
        farmDataStatus: updated.status,
      },
    );

    // Verification is a farmer-facing milestone, not an admin reward.
    await this.rewardService
      .awardEvent(farmOwnerId, 'VERIFICATION', {
        description: `Data verified for farm ${data.farmId}`,
      })
      .catch(() => undefined);

    await this.auditLog.record({
      actorId: adminId,
      action: 'FARM_DATA_VERIFIED',
      targetType: 'FARM_DATA',
      targetId: data.id,
      farmId: data.farmId,
    });

    return updated;
  }

  async reject(
    adminId: string,
    farmDataId: string,
    rejectionReason: string,
  ): Promise<FarmDataRecord> {
    // Enforced here as well as in the DTO, so the rule holds for any caller.
    const reason = rejectionReason?.trim();
    if (!reason) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'REJECTION_REASON_REQUIRED',
        message: 'A rejection reason is required',
        details: {},
      });
    }

    const data = await this.assertReviewable(adminId, farmDataId);
    const farmOwnerId = await this.getFarmOwnerId(data.farmId);

    const updated = await this.farmDataRepository.updateStatus(
      data.id,
      'REJECTED',
      reason,
    );

    await this.scoringService.recalculateFromFarmData(
      farmOwnerId,
      data.farmId,
      {
        ...updated,
        farmDataStatus: updated.status,
      },
    );

    await this.auditLog.record({
      actorId: adminId,
      action: 'FARM_DATA_REJECTED',
      targetType: 'FARM_DATA',
      targetId: data.id,
      farmId: data.farmId,
      details: reason,
    });

    return updated;
  }

  async startReview(
    adminId: string,
    farmDataId: string,
  ): Promise<FarmDataRecord> {
    const data = await this.assertReviewable(adminId, farmDataId);

    if (data.status === 'REVIEW') {
      throw new BadRequestException({
        statusCode: 400,
        code: 'FARM_DATA_ALREADY_IN_REVIEW',
        message: 'Farm data is already under review',
        details: {},
      });
    }

    const updated = await this.farmDataRepository.updateStatus(
      data.id,
      'REVIEW',
    );

    await this.auditLog.record({
      actorId: adminId,
      action: 'FARM_DATA_REVIEWED',
      targetType: 'FARM_DATA',
      targetId: data.id,
      farmId: data.farmId,
    });

    return updated;
  }

  async getAuditLog(): Promise<ReturnType<AuditLog['findAll']>> {
    return this.auditLog.findAll();
  }

  private async assertReviewable(
    adminId: string,
    farmDataId: string,
  ): Promise<FarmDataRecord> {
    const data = await this.farmDataRepository.findById(farmDataId);
    if (!data) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'FARM_DATA_NOT_FOUND',
        message: 'Farm data not found',
        details: {},
      });
    }

    if (data.status === 'VERIFIED') {
      throw new BadRequestException({
        statusCode: 400,
        code: 'FARM_DATA_ALREADY_VERIFIED',
        message: 'Farm data has already been verified',
        details: {},
      });
    }

    const farmOwnerId = await this.getFarmOwnerId(data.farmId);
    if (farmOwnerId === adminId) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'CANNOT_REVIEW_OWN_SUBMISSION',
        message: 'An admin cannot review their own submission',
        details: {},
      });
    }

    return data;
  }

  private async getFarmOwnerId(farmId: string): Promise<string> {
    const farm = await this.farmsService.findByIdForAdmin(farmId);
    if (!farm) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'FARM_NOT_FOUND',
        message: 'Farm not found',
        details: {},
      });
    }
    return farm.userId;
  }
}
