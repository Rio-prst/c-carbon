import type { ProjectStatus } from '../generated/prisma/client.js';

export const CARBON_PROJECT_REPOSITORY = Symbol('CARBON_PROJECT_REPOSITORY');

export type { ProjectStatus };

/**
 * The lifecycle states the MVP is allowed to reach. The enum also carries
 * VERIFICATION through TRADING because docs/DATABASE.md defines them, but
 * docs/BUSINESS-RULES.md §9 forbids the product from implying registration,
 * issuance or trading happened, so those states are never produced or accepted
 * as a transition target here.
 */
export const MVP_PROJECT_STATUSES = [
  'CANDIDATE',
  'ASSESSMENT',
  'AGGREGATING',
] as const satisfies readonly ProjectStatus[];

export type MvpProjectStatus = (typeof MVP_PROJECT_STATUSES)[number];

export const isMvpProjectStatus = (
  status: string,
): status is MvpProjectStatus =>
  (MVP_PROJECT_STATUSES as readonly string[]).includes(status);

export type CreateCarbonProjectInput = {
  name: string;
  region: string;
  commodityFocus: string;
};

export type CarbonProjectRecord = {
  id: string;
  name: string;
  status: ProjectStatus;
  region: string;
  commodityFocus: string;
  totalFarms: number;
  totalAreaHa: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectFarmRecord = {
  id: string;
  carbonProjectId: string;
  farmId: string;
  addedAt: Date;
};

export interface ICarbonProjectRepository {
  create(input: CreateCarbonProjectInput): Promise<CarbonProjectRecord>;

  findById(id: string): Promise<CarbonProjectRecord | null>;

  findAll(): Promise<CarbonProjectRecord[]>;

  updateStatus(id: string, status: ProjectStatus): Promise<CarbonProjectRecord>;

  /**
   * Replaces the project membership in one call so a failed aggregation cannot
   * leave a partial set of farms attached.
   */
  setProjectFarms(
    carbonProjectId: string,
    farmIds: string[],
  ): Promise<CarbonProjectRecord>;

  findFarmIds(carbonProjectId: string): Promise<string[]>;

  findProjectIdsByFarmId(farmId: string): Promise<string[]>;

  /**
   * Every farm id attached to any project, across all projects.
   *
   * A farm may join more than one project, because the unique constraint only
   * guards (carbonProjectId, farmId). Summing each project's total_farms would
   * therefore overstate how much land a corporate reader is shown as reachable,
   * so the caller de-duplicates this list instead.
   */
  findAllProjectFarmIds(): Promise<string[]>;
}
