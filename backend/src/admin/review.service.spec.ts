import { InMemoryAuditLogRepository } from '../testing/in-memory-audit-log.repository';
import type {
  IEvidenceRepository,
  IFarmDataRepository,
} from '../farm-data/farm-data.repository.interface';
import {
  InMemoryFarmDataRepository,
  InMemoryEvidenceRepository,
} from '../testing/in-memory-farm-data.repository';
import { jest } from '@jest/globals';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewService } from './review.service';
import { AuditLog } from './audit-log.service';
import type { FarmDataRecord } from '../farm-data/farm-data.repository.interface';

const OWNER_ID = 'farmer-1';
const ADMIN_ID = 'admin-1';

describe('ReviewService', () => {
  let service: ReviewService;
  let auditLog: AuditLog;
  let dataRepo: IFarmDataRepository;
  let evidenceRepo: IEvidenceRepository;

  const farmsService = {
    findByIdForAdmin: jest.fn<() => Promise<unknown>>(),
    assertOwnership: jest.fn<() => Promise<unknown>>(),
  };

  const scoring = {
    recalculateFromFarmData: jest.fn<() => Promise<unknown>>(),
  };

  const rewards = {
    awardEvent: jest.fn<() => Promise<unknown>>(),
  };

  const FARM = {
    id: 'farm-1',
    userId: OWNER_ID,
    digitalFarmId: 'DFID-1',
    name: 'Sukamaju',
    lat: -6.9,
    lng: 107.6,
    landAreaHa: 3,
    commodity: 'Padi',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  async function seed(
    overrides: Partial<FarmDataRecord> = {},
  ): Promise<FarmDataRecord> {
    return dataRepo.create({
      farmId: FARM.id,
      farmSeasonId: 'season-1',
      yieldKg: 4000,
      waterUsage: 800,
      fertilizerUsage: 200,
      pesticideUsage: 10,
      wasteManagementPractice: 'composting',
      soilPractice: 'cover_cropping',
      energyUsage: 300,
      lowCarbonPractice: true,
      ...overrides,
    });
  }

  beforeEach(() => {
    dataRepo = new InMemoryFarmDataRepository();
    evidenceRepo = new InMemoryEvidenceRepository();
    auditLog = new AuditLog(new InMemoryAuditLogRepository());

    farmsService.findByIdForAdmin.mockResolvedValue(FARM);
    scoring.recalculateFromFarmData.mockResolvedValue(undefined);
    rewards.awardEvent.mockResolvedValue(undefined);
    farmsService.assertOwnership.mockResolvedValue(undefined);

    service = new ReviewService(
      dataRepo,
      evidenceRepo,
      farmsService as never,
      scoring as never,
      rewards as never,
      auditLog,
    );
  });

  it('lists unverified submissions for review', async () => {
    await seed();

    const queue = await service.getQueue(ADMIN_ID);

    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      farmId: FARM.id,
      digitalFarmId: 'DFID-1',
      farmName: 'Sukamaju',
      commodity: 'Padi',
      evidenceCount: 0,
    });
  });

  it('hides verified submissions from the queue', async () => {
    const data = await seed();
    await service.verify(ADMIN_ID, data.id);

    const queue = await service.getQueue(ADMIN_ID);

    expect(queue).toHaveLength(0);
  });

  it('counts the evidence attached to each submission', async () => {
    const data = await seed();
    await evidenceRepo.create({ farmDataId: data.id, type: 'photo' });

    const queue = await service.getQueue(ADMIN_ID);

    expect(queue[0].evidenceCount).toBe(1);
  });

  it('never lists an admin own submission', async () => {
    farmsService.findByIdForAdmin.mockResolvedValue({
      ...FARM,
      userId: ADMIN_ID,
    });
    await seed();

    const queue = await service.getQueue(ADMIN_ID);

    expect(queue).toHaveLength(0);
  });

  it('verifies a submission and marks it VERIFIED', async () => {
    const data = await seed();

    const updated = await service.verify(ADMIN_ID, data.id);

    expect(updated.status).toBe('VERIFIED');
    expect(updated.rejectionReason).toBeUndefined();
  });

  it('recalculates the score after verification', async () => {
    const data = await seed();

    await service.verify(ADMIN_ID, data.id);

    expect(scoring.recalculateFromFarmData).toHaveBeenCalledWith(
      OWNER_ID,
      FARM.id,
      expect.objectContaining({ farmDataStatus: 'VERIFIED' }),
    );
  });

  it('awards the verification reward to the farmer, not the admin', async () => {
    const data = await seed();

    await service.verify(ADMIN_ID, data.id);

    const call = rewards.awardEvent.mock.calls[0] as unknown as [
      string,
      string,
    ];
    expect(call[0]).toBe(OWNER_ID);
    expect(call[1]).toBe('VERIFICATION');
  });

  it('keeps the verification even when the reward fails', async () => {
    const data = await seed();
    rewards.awardEvent.mockRejectedValue(new Error('reward store down'));

    const updated = await service.verify(ADMIN_ID, data.id);

    expect(updated.status).toBe('VERIFIED');
  });

  it('rejects a submission and stores the reason', async () => {
    const data = await seed();

    const updated = await service.reject(
      ADMIN_ID,
      data.id,
      'Foto tidak terbaca',
    );

    expect(updated.status).toBe('REJECTED');
    expect(updated.rejectionReason).toBe('Foto tidak terbaca');
  });

  it('requires a rejection reason', async () => {
    const data = await seed();

    await expect(
      service.reject(ADMIN_ID, data.id, '   '),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('writes an audit record for every sensitive action', async () => {
    const first = await seed();
    const second = await seed();

    await service.verify(ADMIN_ID, first.id);
    await service.reject(ADMIN_ID, second.id, 'Angka tidak konsisten');

    const log = await service.getAuditLog();
    const actions = log.map((entry) => entry.action).sort();

    expect(actions).toEqual(['FARM_DATA_REJECTED', 'FARM_DATA_VERIFIED']);
  });

  it('stores the rejection reason in the audit record', async () => {
    const data = await seed();
    await service.reject(ADMIN_ID, data.id, 'Angka tidak konsisten');

    const log = await service.getAuditLog();

    expect(log[0].details).toBe('Angka tidak konsisten');
    expect(log[0].actorId).toBe(ADMIN_ID);
  });

  it('records who acted, not just what happened', async () => {
    const data = await seed();

    await service.verify(ADMIN_ID, data.id);

    const log = await service.getAuditLog();
    expect(log[0]).toMatchObject({
      actorId: ADMIN_ID,
      action: 'FARM_DATA_VERIFIED',
      targetType: 'FARM_DATA',
      targetId: data.id,
      farmId: FARM.id,
    });
    expect(log[0].id).toBeDefined();
    expect(log[0].createdAt).toBeInstanceOf(Date);
  });

  it('moves a submission into review', async () => {
    const data = await seed();

    const updated = await service.startReview(ADMIN_ID, data.id);

    expect(updated.status).toBe('REVIEW');
  });

  it('refuses to verify the same submission twice', async () => {
    const data = await seed();
    await service.verify(ADMIN_ID, data.id);

    await expect(service.verify(ADMIN_ID, data.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuses to start a review that is already in progress', async () => {
    const data = await seed();
    await service.startReview(ADMIN_ID, data.id);

    await expect(service.startReview(ADMIN_ID, data.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects a missing submission', async () => {
    await expect(service.verify(ADMIN_ID, 'nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refuses to let an admin review their own submission', async () => {
    farmsService.findByIdForAdmin.mockResolvedValue({
      ...FARM,
      userId: ADMIN_ID,
    });
    const data = await seed();

    await expect(service.verify(ADMIN_ID, data.id)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('clears a stale rejection reason once the data is verified', async () => {
    const data = await seed();
    await service.reject(ADMIN_ID, data.id, ' salah');
    const rejected = await dataRepo.findById(data.id);

    const verified = await service.verify(
      ADMIN_ID,
      (rejected as FarmDataRecord).id,
    );

    expect(verified.rejectionReason).toBeUndefined();
  });

  it('orders the queue oldest submission first', async () => {
    const first = await seed();
    const second = await seed();

    const queue = await service.getQueue(ADMIN_ID);
    const ids = queue.map((item) => item.id);

    expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));
  });
});
