import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditLog } from '../admin/audit-log.service';
import { FARM_DATA_REPOSITORY } from '../farm-data/farm-data.repository.interface';
import type { IFarmDataRepository } from '../farm-data/farm-data.repository.interface';
import { FarmsService } from '../farms/farms.service';
import { ConsentService } from '../consent/consent.service';
import {
  CARBON_PROJECT_REPOSITORY,
  isMvpProjectStatus,
  type CarbonProjectRecord,
  type ICarbonProjectRepository,
  type MvpProjectStatus,
  type ProjectStatus,
} from './carbon-project.repository.interface';
import {
  PROJECT_ELIGIBILITY_PROVIDER,
  type EligibilityVerdict,
  type IProjectEligibilityProvider,
} from './project-eligibility.provider.interface';

export type CreateProjectInput = {
  name: string;
  region: string;
  commodityFocus: string;
};

/** Aggregate shape shared by the farmer and corporate-facing responses. */
export type ProjectSummaryResponse = {
  id: string;
  name: string;
  status: ProjectStatus;
  region: string;
  commodity_focus: string;
  total_farms: number;
  total_area_ha: number;
  created_at: string;
  is_provisional: boolean;
};

export type EligibleFarmResponse = {
  farm_id: string;
  land_area_ha: number;
  criteria: EligibilityVerdict['criteria'];
  not_assessed: EligibilityVerdict['notAssessed'];
};

export type AggregationResultResponse = {
  project_id: string;
  status: ProjectStatus;
  total_farms: number;
  total_area_ha: number;
  eligible_farm_ids: string[];
  provisional_notice: string;
};

export const PROJECT_PROVISIONAL_NOTICE =
  'Kelayakan dihitung dari kondisi yang dapat dinilai platform. Baseline belum dinilai dan metodologi karbon penuh di luar cakupan MVP. Keanggotaan proyek bukan kredit karbon.';

@Injectable()
export class CarbonProjectService {
  constructor(
    @Inject(CARBON_PROJECT_REPOSITORY)
    private readonly projectRepository: ICarbonProjectRepository,
    @Inject(PROJECT_ELIGIBILITY_PROVIDER)
    private readonly eligibility: IProjectEligibilityProvider,
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    private readonly farmsService: FarmsService,
    private readonly consentService: ConsentService,
    private readonly auditLog: AuditLog,
  ) {}

  private async assertProjectExists(id: string): Promise<CarbonProjectRecord> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'CARBON_PROJECT_NOT_FOUND',
        message: 'Carbon project not found',
        details: {},
      });
    }
    return project;
  }

  private serializeSummary(
    project: CarbonProjectRecord,
  ): ProjectSummaryResponse {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      region: project.region,
      commodity_focus: project.commodityFocus,
      total_farms: project.totalFarms,
      total_area_ha: project.totalAreaHa,
      created_at: project.createdAt.toISOString(),
      is_provisional: this.eligibility.isProvisional,
    };
  }

  async createProject(
    adminId: string,
    input: CreateProjectInput,
  ): Promise<ProjectSummaryResponse> {
    const project = await this.projectRepository.create(input);

    await this.auditLog.record({
      actorId: adminId,
      action: 'CARBON_PROJECT_CREATED',
      targetType: 'CARBON_PROJECT',
      targetId: project.id,
      details: `Fokus komoditas: ${project.commodityFocus}`,
    });

    return this.serializeSummary(project);
  }

  /** Admin listing: the same aggregate shape, no farmer identity either way. */
  async listProjects(): Promise<ProjectSummaryResponse[]> {
    const projects = await this.projectRepository.findAll();
    return projects.map((project) => this.serializeSummary(project));
  }

  /**
   * Farmer-facing project context. Deliberately aggregate only: it never
   * returns project_farms, so a farmer cannot discover which other farms are
   * enrolled. docs/BUSINESS-RULES.md §10 forbids exposing individual farmer
   * identity through project views.
   */
  async getProject(id: string): Promise<ProjectSummaryResponse> {
    const project = await this.assertProjectExists(id);
    return this.serializeSummary(project);
  }

  /**
   * Admin preview of which farms pass the gates, and why the others do not.
   * Returned before aggregation so the filter is inspectable rather than a
   * side effect.
   */
  async listEligibleFarms(): Promise<{
    eligible: EligibleFarmResponse[];
    rejected: EligibleFarmResponse[];
    min_required: number;
    min_eligible_now: number;
    not_assessed: EligibilityVerdict['notAssessed'];
  }> {
    const farms = await this.farmsService.findAllForAdmin();
    const verdicts = await Promise.all(
      farms.map(async (farm) => {
        const verdict = await this.evaluateFarm(farm);
        const hasConsent =
          await this.consentService.hasActiveCarbonProjectConsent(farm.userId);

        // Listed as its own reason so an admin can tell a withdrawn consent
        // apart from incomplete data.
        const criteria = hasConsent
          ? verdict.criteria
          : [
              ...verdict.criteria,
              {
                key: 'consent' as const,
                passed: false,
                reason:
                  'Persetujuan penggunaan data proyek karbon telah ditarik atau belum diberikan',
              },
            ];

        return {
          farm,
          verdict: {
            ...verdict,
            criteria,
            eligible: verdict.eligible && hasConsent,
          },
        };
      }),
    );

    const eligible = verdicts
      .filter((entry) => entry.verdict.eligible)
      .map((entry) => this.serializeEligible(entry.farm, entry.verdict));

    const rejected = verdicts
      .filter((entry) => !entry.verdict.eligible)
      .map((entry) => this.serializeEligible(entry.farm, entry.verdict));

    return {
      eligible,
      rejected,
      min_required: this.eligibility.minEligibleFarms,
      min_eligible_now: eligible.length,
      not_assessed: [
        {
          component: 'baseline_availability',
          reason: 'Penentuan baseline belum tersedia di MVP',
        },
      ],
    };
  }

  private async evaluateFarm(farm: {
    id: string;
    landAreaHa: number;
    commodity: string;
  }): Promise<EligibilityVerdict> {
    const submissions = await this.farmDataRepository.findByFarmId(farm.id);
    return this.eligibility.evaluate(farm, submissions);
  }

  private serializeEligible(
    farm: { id: string; landAreaHa: number },
    verdict: EligibilityVerdict,
  ): EligibleFarmResponse {
    return {
      farm_id: farm.id,
      land_area_ha: farm.landAreaHa,
      criteria: verdict.criteria,
      not_assessed: verdict.notAssessed,
    };
  }

  /**
   * Attaches every eligible farm to the project.
   *
   * docs/BUSINESS-RULES.md §8 requires aggregation to fail when too few farms
   * qualify, and forbids silently adding farms to make a project look
   * complete. Nothing is written in the failure case, so a project is never
   * left partially aggregated.
   */
  async aggregate(
    adminId: string,
    projectId: string,
  ): Promise<AggregationResultResponse> {
    const project = await this.assertProjectExists(projectId);

    if (project.status === 'AGGREGATING') {
      throw new ConflictException({
        statusCode: 409,
        code: 'PROJECT_ALREADY_AGGREGATING',
        message:
          'Project is already aggregating. Re-aggregating would silently change its membership.',
        details: {},
      });
    }

    const farms = await this.farmsService.findAllForAdmin();
    const candidates: string[] = [];
    const blockedByConsent: string[] = [];

    for (const farm of farms) {
      if (
        farm.commodity.trim().toLowerCase() !==
        project.commodityFocus.trim().toLowerCase()
      ) {
        continue;
      }

      // Consent is a governance boundary, not a record kept for its own sake:
      // docs/BUSINESS-RULES.md §11 says a farmer can withdraw it, so a farm
      // whose owner withdrew must not silently keep entering projects.
      if (
        !(await this.consentService.hasActiveCarbonProjectConsent(farm.userId))
      ) {
        blockedByConsent.push(farm.id);
        continue;
      }

      const verdict = await this.evaluateFarm(farm);
      if (verdict.eligible) candidates.push(farm.id);
    }

    if (candidates.length < this.eligibility.minEligibleFarms) {
      throw new ConflictException({
        statusCode: 409,
        code: 'NOT_ENOUGH_ELIGIBLE_FARMS',
        message: `Aggregation requires at least ${this.eligibility.minEligibleFarms} eligible farms, found ${candidates.length}. No farms were added.`,
        details: {
          required: this.eligibility.minEligibleFarms,
          eligible: candidates.length,
          commodity_focus: project.commodityFocus,
          // Surfaced so a farmer withdrawing consent does not read as an
          // unexplained data problem.
          blocked_by_missing_consent: blockedByConsent.length,
        },
      });
    }

    const updated = await this.projectRepository.setProjectFarms(
      projectId,
      candidates,
    );

    // Farm status follows the membership rather than being set independently,
    // so it cannot be skipped ahead of the underlying condition.
    for (const farmId of candidates) {
      await this.farmsService.updateStatusForAdmin(farmId, 'CARBON_CANDIDATE');
    }

    await this.auditLog.record({
      actorId: adminId,
      action: 'CARBON_PROJECT_AGGREGATED',
      targetType: 'CARBON_PROJECT',
      targetId: projectId,
      details: `${updated.totalFarms} farms, ${updated.totalAreaHa} ha`,
    });

    return {
      project_id: updated.id,
      status: updated.status,
      total_farms: updated.totalFarms,
      total_area_ha: updated.totalAreaHa,
      eligible_farm_ids: candidates,
      provisional_notice: PROJECT_PROVISIONAL_NOTICE,
    };
  }

  async changeStatus(
    adminId: string,
    projectId: string,
    nextStatus: string,
  ): Promise<ProjectSummaryResponse> {
    const project = await this.assertProjectExists(projectId);

    if (!isMvpProjectStatus(nextStatus)) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PROJECT_STATUS_NOT_SUPPORTED',
        message: `Status ${nextStatus} is outside the MVP lifecycle. Only CANDIDATE, ASSESSMENT and AGGREGATING are reachable.`,
        details: {},
      });
    }

    if (nextStatus === project.status) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'PROJECT_STATUS_UNCHANGED',
        message: `Project is already ${project.status}`,
        details: {},
      });
    }

    if (!this.isForwardTransition(project.status, nextStatus)) {
      throw new ConflictException({
        statusCode: 409,
        code: 'PROJECT_STATUS_TRANSITION_INVALID',
        message: `Cannot move a project from ${project.status} to ${nextStatus}.`,
        details: { from: project.status, to: nextStatus },
      });
    }

    const updated = await this.projectRepository.updateStatus(
      projectId,
      nextStatus,
    );

    await this.auditLog.record({
      actorId: adminId,
      action: 'CARBON_PROJECT_STATUS_CHANGED',
      targetType: 'CARBON_PROJECT',
      targetId: projectId,
      details: `${project.status} -> ${updated.status}`,
    });

    return this.serializeSummary(updated);
  }

  /**
   * Forward-only. docs/UI-SPEC.md ADMIN-02 says backwards transitions must not
   * be allowed without an audit trail; MVP has no mechanism for justifying a
   * reversal, so they are refused outright rather than audited.
   */
  private isForwardTransition(
    from: ProjectStatus,
    to: MvpProjectStatus,
  ): boolean {
    const order: ProjectStatus[] = ['CANDIDATE', 'ASSESSMENT', 'AGGREGATING'];
    return order.indexOf(to) > order.indexOf(from);
  }
}
