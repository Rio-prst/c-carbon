import { describe, expect, it, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import type {
  CorporateRecord,
  CreateCorporateInput,
  ICorporateRepository,
} from './corporate.repository.interface';
import type {
  CarbonProjectRecord,
  CreateCarbonProjectInput,
  ICarbonProjectRepository,
  ProjectStatus,
} from '../carbon-project/carbon-project.repository.interface';

const CORPORATE_USER = 'corporate-1';

class FakeCorporateRepository implements ICorporateRepository {
  rows: CorporateRecord[] = [];

  create(input: CreateCorporateInput): Promise<CorporateRecord> {
    const row: CorporateRecord = {
      id: 'corp-1',
      ...input,
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    };
    this.rows.push(row);
    return Promise.resolve(row);
  }

  findByUserId(userId: string): Promise<CorporateRecord | null> {
    return Promise.resolve(this.rows.find((r) => r.userId === userId) ?? null);
  }

  findById(id: string): Promise<CorporateRecord | null> {
    return Promise.resolve(this.rows.find((r) => r.id === id) ?? null);
  }
}

class FakeProjectRepository implements ICarbonProjectRepository {
  rows: CarbonProjectRecord[] = [];
  membership = new Map<string, string[]>();

  create(input: CreateCarbonProjectInput): Promise<CarbonProjectRecord> {
    const row: CarbonProjectRecord = {
      id: `project-${this.rows.length + 1}`,
      status: 'CANDIDATE',
      totalFarms: 0,
      totalAreaHa: 0,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...input,
    };
    this.rows.push(row);
    this.membership.set(row.id, []);
    return Promise.resolve(row);
  }

  findById(id: string): Promise<CarbonProjectRecord | null> {
    return Promise.resolve(this.rows.find((r) => r.id === id) ?? null);
  }

  findAll(): Promise<CarbonProjectRecord[]> {
    return Promise.resolve([...this.rows]);
  }

  updateStatus(
    id: string,
    status: ProjectStatus,
  ): Promise<CarbonProjectRecord> {
    const row = { ...this.rows.find((r) => r.id === id)!, status };
    this.rows = this.rows.map((r) => (r.id === id ? row : r));
    return Promise.resolve(row);
  }

  setProjectFarms(
    carbonProjectId: string,
    farmIds: string[],
  ): Promise<CarbonProjectRecord> {
    const row = {
      ...this.rows.find((r) => r.id === carbonProjectId)!,
      totalFarms: farmIds.length,
      totalAreaHa: farmIds.length * 2,
    };
    this.rows = this.rows.map((r) => (r.id === carbonProjectId ? row : r));
    this.membership.set(carbonProjectId, farmIds);
    return Promise.resolve(row);
  }

  findFarmIds(carbonProjectId: string): Promise<string[]> {
    return Promise.resolve(this.membership.get(carbonProjectId) ?? []);
  }

  findProjectIdsByFarmId(farmId: string): Promise<string[]> {
    return Promise.resolve(
      [...this.membership.entries()]
        .filter(([, farms]) => farms.includes(farmId))
        .map(([id]) => id),
    );
  }

  findAllProjectFarmIds(): Promise<string[]> {
    return Promise.resolve([...new Set([...this.membership.values()].flat())]);
  }
}

function project(
  overrides: Partial<CarbonProjectRecord> = {},
): CarbonProjectRecord {
  return {
    id: 'project-1',
    name: 'Proyek Karet',
    status: 'AGGREGATING',
    region: 'Jawa Barat',
    commodityFocus: 'Karet',
    totalFarms: 3,
    totalAreaHa: 13.5,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

describe('CorporateService', () => {
  let service: CorporateService;
  let corporateRepository: FakeCorporateRepository;
  let projectRepository: FakeProjectRepository;

  beforeEach(() => {
    corporateRepository = new FakeCorporateRepository();
    corporateRepository.rows.push({
      id: 'corp-1',
      userId: CORPORATE_USER,
      companyName: 'PT Karbon Nusantara',
      industry: 'Industri manufaktur',
      region: 'Jawa Barat',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    projectRepository = new FakeProjectRepository();
    service = new CorporateService(corporateRepository, projectRepository);
  });

  it('reports the company profile with the aggregates', async () => {
    projectRepository.rows.push(project());
    projectRepository.membership.set('project-1', [
      'farm-a',
      'farm-b',
      'farm-c',
    ]);

    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.company_name).toBe('PT Karbon Nusantara');
    expect(overview.industry).toBe('Industri manufaktur');
    expect(overview.project_count).toBe(1);
    expect(overview.total_farms).toBe(3);
    expect(overview.total_area_ha).toBe(13.5);
  });

  /**
   * A farm can join more than one project, because the unique constraint only
   * guards (carbon_project_id, farm_id). Summing per-project totals would tell
   * a corporate reader there are more farms than actually exist.
   */
  it('counts a farm shared between two projects once', async () => {
    projectRepository.rows.push(project({ id: 'project-1', totalFarms: 3 }));
    projectRepository.rows.push(
      project({ id: 'project-2', name: 'Proyek Karet 2', totalFarms: 3 }),
    );
    // farm-a appears in both projects.
    projectRepository.membership.set('project-1', [
      'farm-a',
      'farm-b',
      'farm-c',
    ]);
    projectRepository.membership.set('project-2', [
      'farm-a',
      'farm-d',
      'farm-e',
    ]);

    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.total_farms).toBe(5);
    expect(overview.project_count).toBe(2);
  });

  it('still sums area across projects, which may exceed distinct farms', async () => {
    projectRepository.rows.push(project({ id: 'project-1', totalAreaHa: 10 }));
    projectRepository.rows.push(project({ id: 'project-2', totalAreaHa: 10 }));
    projectRepository.membership.set('project-1', ['farm-a']);
    projectRepository.membership.set('project-2', ['farm-a']);

    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.total_farms).toBe(1);
    expect(overview.total_area_ha).toBe(20);
  });

  it('lists distinct commodities and regions', async () => {
    projectRepository.rows.push(
      project({
        id: 'project-1',
        commodityFocus: 'Karet',
        region: 'Jawa Barat',
      }),
      project({
        id: 'project-2',
        commodityFocus: 'Karet',
        region: 'Jawa Barat',
      }),
      project({ id: 'project-3', commodityFocus: 'Kopi', region: 'Sumatera' }),
    );

    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.commodities).toEqual(['Karet', 'Kopi']);
    expect(overview.regions).toEqual(['Jawa Barat', 'Sumatera']);
  });

  it('breaks projects down by lifecycle status', async () => {
    projectRepository.rows.push(
      project({ id: 'project-1', status: 'CANDIDATE' }),
      project({ id: 'project-2', status: 'CANDIDATE' }),
      project({ id: 'project-3', status: 'AGGREGATING' }),
    );

    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.status_breakdown).toEqual(
      expect.arrayContaining([
        { status: 'CANDIDATE', count: 2 },
        { status: 'AGGREGATING', count: 1 },
      ]),
    );
  });

  it('returns zeroed aggregates when no project exists', async () => {
    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.project_count).toBe(0);
    expect(overview.total_farms).toBe(0);
    expect(overview.total_area_ha).toBe(0);
    expect(overview.commodities).toEqual([]);
  });

  it('reports a missing corporate profile as not found', async () => {
    await expect(service.getOverview('unknown-user')).rejects.toThrow(
      NotFoundException,
    );
  });

  /**
   * BUSINESS-RULES.md §10 forbids exposing farmer identity or individual farm
   * identity through corporate views.
   */
  it('carries no farmer or individual farm identity', async () => {
    projectRepository.rows.push(project());
    projectRepository.membership.set('project-1', [
      'farm-a',
      'farm-b',
      'farm-c',
    ]);

    const overview = await service.getOverview(CORPORATE_USER);
    const payload = JSON.stringify(overview).toLowerCase();

    for (const forbidden of [
      'farmer',
      'petani',
      'user_id',
      'farm_id',
      'digitalfarmid',
      'farm-a',
    ]) {
      expect(payload).not.toContain(forbidden);
    }
  });

  it('states the figures are not carbon credits', async () => {
    const overview = await service.getOverview(CORPORATE_USER);

    expect(overview.disclaimer).toContain('Bukan kredit karbon');
    expect(overview.is_provisional).toBe(true);
  });
});
