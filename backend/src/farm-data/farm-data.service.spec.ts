import { jest } from '@jest/globals';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { FarmDataService } from './farm-data.service';
import { FarmDataRepository } from './farm-data.repository';
import { FarmSeasonRepository } from './farm-season.repository';
import type { FarmSeasonRecord } from './farm-data.repository.interface';

type AsyncMock = jest.Mock<() => Promise<unknown>>;

const OWNER: JwtPayload = { sub: 'user-1', role: 'FARMER' };
const ADMIN: JwtPayload = { sub: 'admin-1', role: 'ADMIN' };

const farm = { id: 'farm-1', userId: OWNER.sub };

const farmsService = {
  resolveAccess: jest.fn<() => Promise<unknown>>(),
};

describe('FarmDataService', () => {
  let service: FarmDataService;
  let dataRepo: FarmDataRepository;
  let seasonRepo: FarmSeasonRepository;
  let scoring: { recalculateFromFarmData: AsyncMock };
  let rewards: { awardEvent: AsyncMock };

  const season: FarmSeasonRecord = {
    id: 'season-1',
    farmId: 'farm-1',
    createdAt: new Date(),
  };

  beforeEach(() => {
    farmsService.resolveAccess.mockResolvedValue(farm);
    dataRepo = new FarmDataRepository();
    seasonRepo = new FarmSeasonRepository();
    scoring = {
      recalculateFromFarmData: jest.fn<() => Promise<unknown>>(),
    };
    rewards = { awardEvent: jest.fn<() => Promise<unknown>>() };
    scoring.recalculateFromFarmData.mockResolvedValue(undefined);
    rewards.awardEvent.mockResolvedValue(undefined);

    jest
      .spyOn(seasonRepo, 'findById')
      .mockImplementation((id) =>
        Promise.resolve(id === season.id ? season : null),
      );

    service = new FarmDataService(
      dataRepo,
      seasonRepo,
      farmsService as never,
      scoring as never,
      rewards as never,
    );
  });

  it('awards a submission reward after recording the data', async () => {
    const created = await service.createData(OWNER, 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    expect(created.farmId).toBe('farm-1');
    expect(rewards.awardEvent).toHaveBeenCalledTimes(1);

    const call = rewards.awardEvent.mock.calls[0] as unknown as [
      string,
      string,
    ];
    expect(call[0]).toBe('user-1');
    expect(call[1]).toBe('FARM_DATA_SUBMISSION');
  });

  it('keeps the submission even when the reward fails', async () => {
    rewards.awardEvent.mockRejectedValue(new Error('reward store down'));

    const created = await service.createData(OWNER, 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    expect(created.id).toBeDefined();
    expect(await dataRepo.findByFarmId('farm-1')).toHaveLength(1);
  });

  it('recalculates the score for every submission', async () => {
    await service.createData(OWNER, 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    expect(scoring.recalculateFromFarmData).toHaveBeenCalledTimes(1);
  });

  it('refuses a season that belongs to another farm', async () => {
    await expect(
      service.createData(OWNER, 'farm-1', {
        farmSeasonId: 'does-not-exist',
        yieldKg: 4000,
        lowCarbonPractice: true,
      }),
    ).rejects.toThrow();

    expect(rewards.awardEvent).not.toHaveBeenCalled();
  });

  it('routes the submission reward to the farm owner when an admin writes', async () => {
    await service.createData(ADMIN, 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    const call = rewards.awardEvent.mock.calls[0] as unknown as [
      string,
      string,
    ];
    expect(call[0]).toBe(OWNER.sub);
    expect(call[0]).not.toBe(ADMIN.sub);
  });

  it('recalculates the score for the farm owner, not the requester', async () => {
    await service.createData(ADMIN, 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    const call = scoring.recalculateFromFarmData.mock.calls[0] as unknown as [
      string,
      string,
    ];
    expect(call[0]).toBe(OWNER.sub);
  });
});
