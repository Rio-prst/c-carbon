import { RewardService } from './reward.service';
import type { IRewardRepository } from './reward.repository.interface';
import { InMemoryRewardRepository } from '../testing/in-memory-reward.repository';

describe('RewardService', () => {
  let service: RewardService;
  let repo: IRewardRepository;

  beforeEach(() => {
    repo = new InMemoryRewardRepository();
    service = new RewardService(repo);
  });

  describe('calculateTier', () => {
    it('returns BASIC for points < 400', () => {
      expect(service.calculateTier(0)).toBe('BASIC');
      expect(service.calculateTier(399)).toBe('BASIC');
    });

    it('returns SILVER for points between 400 and 699', () => {
      expect(service.calculateTier(400)).toBe('SILVER');
      expect(service.calculateTier(699)).toBe('SILVER');
    });

    it('returns GOLD for points between 700 and 899', () => {
      expect(service.calculateTier(700)).toBe('GOLD');
      expect(service.calculateTier(899)).toBe('GOLD');
    });

    it('returns CARBON_READY for points >= 900', () => {
      expect(service.calculateTier(900)).toBe('CARBON_READY');
      expect(service.calculateTier(1500)).toBe('CARBON_READY');
    });
  });

  describe('awardEvent', () => {
    it('awards points and stores event with tier snapshot', async () => {
      const record = await service.awardEvent('user-1', 'FARM_DATA_SUBMISSION');
      expect(record.points).toBe(50);
      expect(record.totalPointsSnapshot).toBe(50);
      expect(record.tierSnapshot).toBe('BASIC');

      const second = await service.awardEvent('user-1', 'VERIFICATION');
      expect(second.points).toBe(100);
      expect(second.totalPointsSnapshot).toBe(150);
      expect(second.tierSnapshot).toBe('BASIC');
    });

    it('upgrades tier when crossing threshold', async () => {
      await service.awardEvent('user-2', 'MILESTONE_BONUS', { points: 420 });
      const summary = await service.getRewardsSummary('user-2');

      expect(summary.total_points).toBe(420);
      expect(summary.tier).toBe('SILVER');
      expect(summary.history.length).toBe(1);
    });
  });
});
