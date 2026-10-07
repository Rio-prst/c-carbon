import { NotFoundException } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type {
  CorporateRecord,
  ICorporateRepository,
} from './corporate.repository.interface';
import { CORPORATE_REPOSITORY } from './corporate.repository.interface';
import type { CarbonProjectRecord } from '../carbon-project/carbon-project.repository.interface';
import {
  CARBON_PROJECT_REPOSITORY,
  type ICarbonProjectRepository,
} from '../carbon-project/carbon-project.repository.interface';

export type CorporateOverviewResponse = {
  company_name: string;
  industry: string;
  region: string;
  /** Distinct farms, so a farm in two projects is counted once. */
  total_farms: number;
  /** Summed across projects, so this can exceed total_farms on purpose. */
  total_area_ha: number;
  project_count: number;
  commodities: string[];
  regions: string[];
  status_breakdown: { status: string; count: number }[];
  is_provisional: boolean;
  disclaimer: string;
};

const DISCLAIMER =
  'Data agregat untuk evaluasi skala. Bukan kredit karbon dan bukan jaminan issuance.';

@Injectable()
export class CorporateService {
  constructor(
    @Inject(CORPORATE_REPOSITORY)
    private readonly corporateRepository: ICorporateRepository,
    @Inject(CARBON_PROJECT_REPOSITORY)
    private readonly projectRepository: ICarbonProjectRepository,
  ) {}

  private async assertProfile(userId: string): Promise<CorporateRecord> {
    const profile = await this.corporateRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'CORPORATE_NOT_FOUND',
        message: 'Corporate profile not found',
        details: {},
      });
    }
    return profile;
  }

  /**
   * Aggregate view for a corporate reader.
   *
   * Carries no farm membership and no farmer identity, per BUSINESS-RULES.md
   * §10. total_farms is de-duplicated because a farm can belong to more than
   * one project; total_area_ha is not, because the same land can legitimately
   * be counted in two projects' scope and the two numbers are read as different
   * things (distinct farms versus summed project area).
   */
  async getOverview(userId: string): Promise<CorporateOverviewResponse> {
    const profile = await this.assertProfile(userId);
    const projects: CarbonProjectRecord[] =
      await this.projectRepository.findAll();
    const allFarmIds = await this.projectRepository.findAllProjectFarmIds();

    const distinctFarms = new Set(allFarmIds).size;
    const totalArea = projects.reduce(
      (sum, project) => sum + project.totalAreaHa,
      0,
    );

    const statusBreakdown = new Map<string, number>();
    for (const project of projects) {
      statusBreakdown.set(
        project.status,
        (statusBreakdown.get(project.status) ?? 0) + 1,
      );
    }

    return {
      company_name: profile.companyName,
      industry: profile.industry,
      region: profile.region,
      total_farms: distinctFarms,
      total_area_ha: Number(totalArea.toFixed(4)),
      project_count: projects.length,
      commodities: uniqueSorted(projects.map((p) => p.commodityFocus)),
      regions: uniqueSorted(projects.map((p) => p.region)),
      status_breakdown: [...statusBreakdown.entries()].map(
        ([status, count]) => ({ status, count }),
      ),
      is_provisional: true,
      disclaimer: DISCLAIMER,
    };
  }
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter((v) => v !== ''))].sort(
    (a, b) => a.localeCompare(b, 'id'),
  );
}
