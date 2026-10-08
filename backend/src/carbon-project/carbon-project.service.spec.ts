import { describe, expect, it, beforeEach } from '@jest/globals';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CarbonProjectService } from './carbon-project.service';
import { ProjectEligibilityProvider } from './project-eligibility.provider';
import { FarmDataRepository } from '../farm-data/farm-data.repository';
import { AuditLog } from '../admin/audit-log.service';
import type {
  CarbonProjectRecord,
  CreateCarbonProjectInput,
  ICarbonProjectRepository,
  ProjectStatus,
} from './carbon-project.repository.interface';
import type { FarmRecord } from '../farms/farms.repository.interface';
import type { CreateFarmDataInput } from '../farm-data/farm-data.repository.interface';

const ADMIN_ID = 'admin-1';

type StoredProject = CarbonProjectRecord;

function project(overrides: Partial<StoredProject> = {}): StoredProject {
  return {
    id: 'project-1',
    name: 'Proyek Karetpiaw',
    status: 'CANDIDATE',
    region: 'Jawa Barat',
    commodityFocus: 'Karet',
    totalFarms: 0,
    totalAreaHa: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

/** In-memory stand-in so the service can be exercised without a database. */
class FakeProjectRepository implements ICarbonProjectRepository {
  rows = new Map<string, StoredProject>();
  membership = new Map<string, string[]>();
  lastMembershipCall: string[] | null = null;

  constructor(seed: StoredProject[] = []) {
    for (const row of seed) {
      this.rows.set(row.id, row);
      this.membership.set(row.id, []);
    }
  }

  create(input: CreateCarbonProjectInput): Promise<CarbonProjectRecord> {
    const row = project({ id: `project-${this.rows.size + 1}`, ...input });
    this.rows.set(row.id, row);
    this.membership.set(row.id, []);
    return Promise.resolve(row);
  }

  findById(id: string) {
    return Promise.resolve(this.rows.get(id) ?? null);
  }

  findAll() {
    return Promise.resolve([...this.rows.values()]);
  }

  updateStatus(id: string, status: ProjectStatus) {
    const row = { ...this.rows.get(id)!, status };
    this.rows.set(id, row);
    return Promise.resolve(row);
  }

  setProjectFarms(carbonProjectId: string, farmIds: string[]) {
    this.lastMembershipCall = farmIds;
    const row = {
      ...this.rows.get(carbonProjectId)!,
      status: 'AGGREGATING' as ProjectStatus,
      totalFarms: farmIds.length,
      totalAreaHa: farmIds.length * 2,
    };
    this.rows.set(carbonProjectId, row);
    this.membership.set(carbonProjectId, farmIds);
    return Promise.resolve(row);
  }

  findFarmIds(carbonProjectId: string) {
    return Promise.resolve(this.membership.get(carbonProjectId) ?? []);
  }

  findProjectIdsByFarmId(farmId: string) {
    return Promise.resolve(
      [...this.membership.entries()]
        .filter(([, farms]) => farms.includes(farmId))
        .map(([id]) => id),
    );
  }

  findAllProjectFarmIds() {
    return Promise.resolve([...new Set([...this.membership.values()].flat())]);
  }
}

class FakeFarmsService {
  rows: FarmRecord[] = [];
  statusUpdates: { id: string; status: string }[] = [];

  findAllForAdmin() {
    return Promise.resolve(this.rows);
  }

  updateStatusForAdmin(id: string, status: string) {
    this.statusUpdates.push({ id, status });
    const row = this.rows.find((f) => f.id === id)!;
    row.status = status as FarmRecord['status'];
    return Promise.resolve(row);
  }
}

class FakeConsentService {
  /** Consent owners, so a test can revoke one and observe the effect. */
  revoked = new Set<string>();

  hasActiveCarbonProjectConsent(userId: string): Promise<boolean> {
    return Promise.resolve(!this.revoked.has(userId));
  }
}

function farm(overrides: Partial<FarmRecord> = {}): FarmRecord {
  return {
    id: 'farm-1',
    userId: 'farmer-1',
    digitalFarmId: 'CF-AAAAA',
    name: 'Lahan Karet 1',
    lat: -6.9,
    lng: 107.6,
    landAreaHa: 2,
    commodity: 'Karet',
    status: 'REGISTERED',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function verifiedInput(farmId: string): CreateFarmDataInput {
  return {
    farmId,
    farmSeasonId: `season-${farmId}`,
    yieldKg: 3000,
    waterUsage: 800,
    fertilizerUsage: 150,
    pesticideUsage: 10,
    energyUsage: 200,
    soilPractice: 'cover_cropping',
    wasteManagementPractice: 'composting',
    lowCarbonPractice: true,
  };
}

describe('CarbonProjectService', () => {
  let service: CarbonProjectService;
  let projectRepository: FakeProjectRepository;
  let farmsService: FakeFarmsService;
  let consentService: FakeConsentService;
  let farmDataRepository: FarmDataRepository;
  let auditLog: AuditLog;

  /** Adds `count` rubber farms whose data is verified and eligible. */
  async function seedEligibleFarms(count: number) {
    for (let i = 1; i <= count; i += 1) {
      const row = farm({
        id: `farm-${i}`,
        // Distinct owner per farm so a consent test can revoke one owner
        // without blocking every farm at once.
        userId: `farmer-${i}`,
        digitalFarmId: `CF-${i}`.padEnd(8, 'A'),
      });
      farmsService.rows.push(row);
      const data = await farmDataRepository.create(verifiedInput(row.id));
      await farmDataRepository.updateStatus(data.id, 'VERIFIED');
    }
  }

  beforeEach(() => {
    projectRepository = new FakeProjectRepository([project()]);
    farmsService = new FakeFarmsService();
    consentService = new FakeConsentService();
    farmDataRepository = new FarmDataRepository();
    auditLog = new AuditLog();

    service = new CarbonProjectService(
      projectRepository,
      new ProjectEligibilityProvider(),
      farmDataRepository,
      farmsService as never,
      consentService as never,
      auditLog,
    );
  });

  describe('createProject', () => {
    it('records the creation in the audit log', async () => {
      const created = await service.createProject(ADMIN_ID, {
        name: 'Proyek Karet Baru',
        region: 'Jawa Barat',
        commodityFocus: 'Karet',
      });

      const records = await auditLog.findAll();
      const entry = records.find((r) => r.action === 'CARBON_PROJECT_CREATED');
      expect(entry?.targetType).toBe('CARBON_PROJECT');
      expect(entry?.targetId).toBe(created.id);
      expect(entry?.actorId).toBe(ADMIN_ID);
    });

    it('leaves farmId absent because a project spans many farms', async () => {
      await service.createProject(ADMIN_ID, {
        name: 'Proyek Karet Baru',
        region: 'Jawa Barat',
        commodityFocus: 'Karet',
      });

      const entry = (await auditLog.findAll()).find(
        (r) => r.action === 'CARBON_PROJECT_CREATED',
      );
      expect(entry?.farmId).toBeUndefined();
    });

    it('marks the response provisional', async () => {
      const created = await service.createProject(ADMIN_ID, {
        name: 'Proyek Karet Baru',
        region: 'Jawa Barat',
        commodityFocus: 'Karet',
      });

      expect(created.is_provisional).toBe(true);
    });
  });

  describe('aggregate', () => {
    it('refuses to aggregate fewer than three eligible farms', async () => {
      await seedEligibleFarms(2);

      await expect(service.aggregate(ADMIN_ID, 'project-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('writes nothing when aggregation fails', async () => {
      await seedEligibleFarms(2);

      await expect(service.aggregate(ADMIN_ID, 'project-1')).rejects.toThrow();
      expect(projectRepository.lastMembershipCall).toBeNull();
      expect((await projectRepository.findById('project-1'))?.totalFarms).toBe(
        0,
      );
    });

    it('explains the shortfall in the error details', async () => {
      await seedEligibleFarms(1);

      try {
        await service.aggregate(ADMIN_ID, 'project-1');
        throw new Error('should have thrown');
      } catch (error) {
        const response = (
          error as {
            getResponse(): { details: { required: number; eligible: number } };
          }
        ).getResponse();
        expect(response.details.required).toBe(3);
        expect(response.details.eligible).toBe(1);
      }
    });

    it('aggregates exactly three eligible farms', async () => {
      await seedEligibleFarms(3);

      const result = await service.aggregate(ADMIN_ID, 'project-1');

      expect(result.total_farms).toBe(3);
      expect(result.status).toBe('AGGREGATING');
      expect(result.eligible_farm_ids).toHaveLength(3);
    });

    /**
     * docs/BUSINESS-RULES.md §8 forbids adding farms just to make a project
     * look complete, so a fourth eligible farm outside the commodity focus must
     * stay out.
     */
    it('does not add an eligible farm of a different commodity', async () => {
      await seedEligibleFarms(3);
      const other = farm({
        id: 'farm-other',
        digitalFarmId: 'CF-OTHER',
        commodity: 'Padi',
      });
      farmsService.rows.push(other);
      const data = await farmDataRepository.create(verifiedInput(other.id));
      await farmDataRepository.updateStatus(data.id, 'VERIFIED');

      const result = await service.aggregate(ADMIN_ID, 'project-1');

      expect(result.eligible_farm_ids).not.toContain('farm-other');
      expect(result.total_farms).toBe(3);
    });

    it('never adds an ineligible farm even when under the threshold', async () => {
      await seedEligibleFarms(3);
      // Eligible except its practices, and the wrong commodity besides.
      const bad = farm({
        id: 'farm-bad',
        digitalFarmId: 'CF-BAD',
        commodity: 'Kopi',
      });
      farmsService.rows.push(bad);
      const data = await farmDataRepository.create({
        ...verifiedInput(bad.id),
        soilPractice: 'conventional',
        wasteManagementPractice: 'landfill',
      });
      await farmDataRepository.updateStatus(data.id, 'VERIFIED');

      const result = await service.aggregate(ADMIN_ID, 'project-1');

      expect(result.eligible_farm_ids).toHaveLength(3);
    });

    it('moves each aggregated farm to CARBON_CANDIDATE', async () => {
      await seedEligibleFarms(3);

      await service.aggregate(ADMIN_ID, 'project-1');

      expect(farmsService.statusUpdates).toHaveLength(3);
      expect(
        farmsService.statusUpdates.every(
          (u) => u.status === 'CARBON_CANDIDATE',
        ),
      ).toBe(true);
    });

    it('audits the aggregation', async () => {
      await seedEligibleFarms(3);

      await service.aggregate(ADMIN_ID, 'project-1');

      const entry = (await auditLog.findAll()).find(
        (r) => r.action === 'CARBON_PROJECT_AGGREGATED',
      );
      expect(entry?.targetType).toBe('CARBON_PROJECT');
      expect(entry?.actorId).toBe(ADMIN_ID);
    });

    it('returns a notice that this is not a carbon credit', async () => {
      await seedEligibleFarms(3);

      const result = await service.aggregate(ADMIN_ID, 'project-1');

      expect(result.provisional_notice).toContain('bukan kredit karbon');
    });

    it('refuses a project that is already aggregating', async () => {
      await seedEligibleFarms(3);
      await service.aggregate(ADMIN_ID, 'project-1');

      await expect(service.aggregate(ADMIN_ID, 'project-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('reports a missing project as not found', async () => {
      await expect(
        service.aggregate(ADMIN_ID, 'does-not-exist'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * docs/BUSINESS-RULES.md §11 makes consent a governance boundary. These prove
   * a withdrawn consent actually changes aggregation rather than only being
   * recorded.
   */
  describe('consent boundary', () => {
    it('excludes a farm whose owner withdrew consent', async () => {
      await seedEligibleFarms(4);
      const target = farmsService.rows[3];
      consentService.revoked.add(target.userId);

      const result = await service.aggregate(ADMIN_ID, 'project-1');

      expect(result.total_farms).toBe(3);
      expect(result.eligible_farm_ids).not.toContain(target.id);
    });

    it('reports the consent shortfall in the error details', async () => {
      await seedEligibleFarms(3);
      consentService.revoked.add('farmer-1');

      try {
        await service.aggregate(ADMIN_ID, 'project-1');
        throw new Error('should have thrown');
      } catch (error) {
        const response = (
          error as {
            getResponse(): { details: { blocked_by_missing_consent: number } };
          }
        ).getResponse();
        expect(response.details.blocked_by_missing_consent).toBeGreaterThan(0);
      }
    });

    it('fails aggregation when consent leaves too few farms', async () => {
      await seedEligibleFarms(3);
      consentService.revoked.add('farmer-1');

      await expect(service.aggregate(ADMIN_ID, 'project-1')).rejects.toThrow(
        ConflictException,
      );
    });

    it('explains consent in the eligible-farm filter', async () => {
      await seedEligibleFarms(3);
      consentService.revoked.add('farmer-1');

      const result = await service.listEligibleFarms();
      const rejected = result.rejected.find((f) => f.farm_id === 'farm-1');
      const consent = rejected?.criteria.find((c) => c.key === 'consent');

      expect(consent?.passed).toBe(false);
      expect(consent?.reason).toContain('ditarik');
    });

    it('counts a farm without consent as not eligible', async () => {
      await seedEligibleFarms(3);
      consentService.revoked.add('farmer-1');

      const result = await service.listEligibleFarms();

      expect(result.min_eligible_now).toBe(2);
      expect(result.eligible.some((f) => f.farm_id === 'farm-1')).toBe(false);
    });
  });

  describe('changeStatus', () => {
    it('allows a forward transition', async () => {
      const updated = await service.changeStatus(
        ADMIN_ID,
        'project-1',
        'ASSESSMENT',
      );

      expect(updated.status).toBe('ASSESSMENT');
    });

    it('refuses a backwards transition', async () => {
      await service.changeStatus(ADMIN_ID, 'project-1', 'ASSESSMENT');

      await expect(
        service.changeStatus(ADMIN_ID, 'project-1', 'CANDIDATE'),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses a status outside the MVP lifecycle', async () => {
      for (const status of [
        'VERIFICATION',
        'REGISTRATION',
        'ISSUANCE',
        'TRADING',
      ]) {
        await expect(
          service.changeStatus(ADMIN_ID, 'project-1', status),
        ).rejects.toThrow(BadRequestException);
      }
    });

    it('refuses a no-op transition', async () => {
      await expect(
        service.changeStatus(ADMIN_ID, 'project-1', 'CANDIDATE'),
      ).rejects.toThrow(BadRequestException);
    });

    it('audits the lifecycle change with both states', async () => {
      await service.changeStatus(ADMIN_ID, 'project-1', 'ASSESSMENT');

      const entry = (await auditLog.findAll()).find(
        (r) => r.action === 'CARBON_PROJECT_STATUS_CHANGED',
      );
      expect(entry?.details).toBe('CANDIDATE -> ASSESSMENT');
    });
  });

  describe('listEligibleFarms', () => {
    it('separates eligible farms from rejected ones', async () => {
      await seedEligibleFarms(2);
      const bad = farm({
        id: 'farm-bad',
        digitalFarmId: 'CF-BAD',
        commodity: 'Karet',
      });
      farmsService.rows.push(bad);

      const result = await service.listEligibleFarms();

      expect(result.eligible).toHaveLength(2);
      expect(result.rejected.map((f) => f.farm_id)).toContain('farm-bad');
    });

    it('reports how many more farms are needed', async () => {
      await seedEligibleFarms(2);

      const result = await service.listEligibleFarms();

      expect(result.min_required).toBe(3);
      expect(result.min_eligible_now).toBe(2);
    });

    it('explains why a farm was rejected', async () => {
      const bad = farm({ id: 'farm-bad', digitalFarmId: 'CF-BAD' });
      farmsService.rows.push(bad);

      const result = await service.listEligibleFarms();
      const rejected = result.rejected[0];

      const verification = rejected.criteria.find(
        (c) => c.key === 'verification',
      );
      expect(verification?.passed).toBe(false);
      expect(verification?.reason).toContain('diverifikasi');
    });
  });

  describe('privacy', () => {
    /**
     * docs/BUSINESS-RULES.md §10 forbids exposing individual farmer identity
     * through project views, so neither the farmer nor the corporate summary
     * may carry farm membership.
     */
    it('never returns farm membership or farmer identity', async () => {
      await seedEligibleFarms(3);
      await service.aggregate(ADMIN_ID, 'project-1');

      const detail = await service.getProject('project-1');
      const list = await service.listProjects();

      for (const payload of [detail, ...list]) {
        const keys = Object.keys(payload);
        expect(keys).not.toContain('project_farms');
        expect(keys).not.toContain('farm_ids');
        expect(keys).not.toContain('user_id');
        expect(keys).not.toContain('farmer');
        expect(JSON.stringify(payload)).not.toContain('farmer-1');
      }
    });
  });
});
