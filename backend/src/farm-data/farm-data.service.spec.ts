import { jest } from '@jest/globals';
import { FarmDataService } from './farm-data.service';
import { FarmDataRepository } from './farm-data.repository';
import { FarmSeasonRepository } from './farm-season.repository';
const farmsService = {
  assertOwnership: jest.fn().mockResolvedValue(undefined),
};

describe('FarmDataService', () => {
  let service: FarmDataService;
  let dataRepo: FarmDataRepository;
  let seasonRepo: FarmSeasonRepository;
  let scoring: { recalculateFromFarmData: jest.Mock };
  let rewards: { awardEvent: jest.Mock };

  const season = { id: 'season-1', farmId: 'farm-1', createdAt: new Date() };

  beforeEach(() => {
    dataRepo = new FarmDataRepository();
    seasonRepo = new FarmSeasonRepository();
    scoring = {
      recalculateFromFarmData: jest.fn().mockResolvedValue(undefined),
    };
    rewards = { awardEvent: jest.fn().mockResolvedValue(undefined) };

    jest.spyOn(seasonRepo, 'create').mockResolvedValue(season);
    jest
      .spyOn(seasonRepo, 'findById')
      .mockImplementation((id) =>
        Promise.resolve(id === season.id ? season : undefined),
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
    const created = await service.createData('user-1', 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    expect(created.farmId).toBe('farm-1');
    expect(rewards.awardEvent).toHaveBeenCalledTimes(1);

    const [userId, eventType] = rewards.awardEvent.mock.calls[0] as [
      string,
      string,
    ];
    expect(userId).toBe('user-1');
    expect(eventType).toBe('FARM_DATA_SUBMISSION');
  });

  it('keeps the submission even when the reward fails', async () => {
    rewards.awardEvent.mockRejectedValue(new Error('reward store down'));

    const created = await service.createData('user-1', 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    expect(created.id).toBeDefined();
    expect(await dataRepo.findByFarmId('farm-1')).toHaveLength(1);
  });

  it('recalculates the score for every submission', async () => {
    await service.createData('user-1', 'farm-1', {
      farmSeasonId: season.id,
      yieldKg: 4000,
      lowCarbonPractice: true,
    });

    expect(scoring.recalculateFromFarmData).toHaveBeenCalledTimes(1);
  });

  it('refuses a season that belongs to another farm', async () => {
    await expect(
      service.createData('user-1', 'farm-1', {
        farmSeasonId: 'does-not-exist',
        yieldKg: 4000,
        lowCarbonPractice: true,
      }),
    ).rejects.toThrow();

    expect(rewards.awardEvent).not.toHaveBeenCalled();
  });
});
