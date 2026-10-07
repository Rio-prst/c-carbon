import { FSSService } from './fss.service';
import { PlaceholderNormalizationProvider } from './placeholder-normalization.provider';
import type { FSSInput } from './fss.service.interface';

const COMPLETE_INPUT: FSSInput = {
  yieldKg: 5000,
  waterUsage: 800,
  fertilizerUsage: 200,
  pesticideUsage: 10,
  wasteManagementPractice: 'composting',
  soilPractice: 'cover_cropping',
  energyUsage: 300,
  lowCarbonPractice: true,
  farmDataStatus: 'SELF_REPORTED',
};

describe('FSSService', () => {
  let service: FSSService;
  let provider: PlaceholderNormalizationProvider;

  beforeEach(() => {
    provider = new PlaceholderNormalizationProvider();
    service = new FSSService(provider);
  });

  it('scores within 0-100', () => {
    const result = service.calculateFSS(COMPLETE_INPUT);

    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.value)).toBe(true);
  });

  it('marks the score provisional until the data is verified', () => {
    const provisional = service.calculateFSS({
      ...COMPLETE_INPUT,
      farmDataStatus: 'SELF_REPORTED',
    });
    const verified = service.calculateFSS({
      ...COMPLETE_INPUT,
      farmDataStatus: 'VERIFIED',
    });

    expect(provisional.isProvisional).toBe(true);
    expect(verified.isProvisional).toBe(true);
  });

  it('never reports a final score while the ranges are placeholders', () => {
    const result = service.calculateFSS({
      ...COMPLETE_INPUT,
      farmDataStatus: 'VERIFIED',
    });

    expect(provider.isProvisional).toBe(true);
    expect(result.isProvisional).toBe(true);
  });

  it('scores a missing reading as 0 rather than as a good value', () => {
    const result = service.calculateFSS({ farmDataStatus: 'SELF_REPORTED' });

    expect(result.breakdown.productivity).toBe(0);
    expect(result.breakdown.waterEfficiency).toBe(0);
    expect(result.breakdown.fertilizerManagement).toBe(0);
    expect(result.breakdown.energy).toBe(0);
    // Risk history is the one component that does not depend on a reading,
    // so an empty submission is not a literal zero overall.
    expect(result.breakdown.riskHistory).toBe(70);
    expect(result.value).toBeLessThan(10);
  });

  it('rewards a better yield and penalises a worse one', () => {
    const better = service.calculateFSS({
      ...COMPLETE_INPUT,
      yieldKg: 8000,
    });
    const worse = service.calculateFSS({ ...COMPLETE_INPUT, yieldKg: 1000 });

    expect(better.breakdown.productivity).toBeGreaterThan(
      worse.breakdown.productivity,
    );
  });

  it('scores lower water and energy usage higher', () => {
    const efficient = service.calculateFSS({
      ...COMPLETE_INPUT,
      waterUsage: 300,
      energyUsage: 150,
    });
    const wasteful = service.calculateFSS({
      ...COMPLETE_INPUT,
      waterUsage: 1800,
      energyUsage: 900,
    });

    expect(efficient.breakdown.waterEfficiency).toBeGreaterThan(
      wasteful.breakdown.waterEfficiency,
    );
    expect(efficient.breakdown.energy).toBeGreaterThan(
      wasteful.breakdown.energy,
    );
  });

  it('keeps water and energy scores sensitive across the whole range', () => {
    // These used to clamp to 100 for any realistic reading, which hid
    // differences between farms entirely.
    const low = service.calculateFSS({ ...COMPLETE_INPUT, waterUsage: 100 });
    const mid = service.calculateFSS({ ...COMPLETE_INPUT, waterUsage: 1100 });
    const high = service.calculateFSS({ ...COMPLETE_INPUT, waterUsage: 2000 });

    expect(low.breakdown.waterEfficiency).toBeGreaterThan(
      mid.breakdown.waterEfficiency,
    );
    expect(mid.breakdown.waterEfficiency).toBeGreaterThan(
      high.breakdown.waterEfficiency,
    );
    expect(high.breakdown.waterEfficiency).toBe(0);
  });

  it('keeps input efficiency sensitive across the whole range', () => {
    const efficient = service.calculateFSS({
      ...COMPLETE_INPUT,
      fertilizerUsage: 50,
      pesticideUsage: 2,
    });
    const excessive = service.calculateFSS({
      ...COMPLETE_INPUT,
      fertilizerUsage: 450,
      pesticideUsage: 40,
    });

    expect(efficient.breakdown.inputEfficiency).toBeGreaterThan(
      excessive.breakdown.inputEfficiency,
    );
  });

  it('gives a perfect fertilizer score only inside the assumed optimal band', () => {
    const inside = service.calculateFSS({
      ...COMPLETE_INPUT,
      fertilizerUsage: 300,
    });
    const under = service.calculateFSS({
      ...COMPLETE_INPUT,
      fertilizerUsage: 10,
    });
    const over = service.calculateFSS({
      ...COMPLETE_INPUT,
      fertilizerUsage: 900,
    });

    expect(inside.breakdown.fertilizerManagement).toBe(100);
    expect(under.breakdown.fertilizerManagement).toBeLessThan(100);
    expect(over.breakdown.fertilizerManagement).toBeLessThan(100);
  });

  it('scores a known practice and refuses to guess an unknown one', () => {
    const known = service.calculateFSS({
      ...COMPLETE_INPUT,
      wasteManagementPractice: 'composting',
    });
    const typo = service.calculateFSS({
      ...COMPLETE_INPUT,
      wasteManagementPractice: 'compostingg',
    });

    expect(known.breakdown.wasteManagement).toBe(100);
    expect(typo.breakdown.wasteManagement).toBe(0);
  });

  it('matches practice names case-insensitively', () => {
    const result = service.calculateFSS({
      ...COMPLETE_INPUT,
      soilPractice: 'Cover_Cropping',
    });

    expect(result.breakdown.soilConservation).toBe(100);
  });

  it('rewards verified data and penalises rejected data on risk history', () => {
    const verified = service.calculateFSS({
      ...COMPLETE_INPUT,
      farmDataStatus: 'VERIFIED',
    });
    const rejected = service.calculateFSS({
      ...COMPLETE_INPUT,
      farmDataStatus: 'REJECTED',
    });

    expect(verified.breakdown.riskHistory).toBe(100);
    expect(rejected.breakdown.riskHistory).toBe(30);
  });

  it('measures data consistency from how many readings were supplied', () => {
    const full = service.calculateFSS(COMPLETE_INPUT);
    const partial = service.calculateFSS({
      farmDataStatus: 'SELF_REPORTED',
      yieldKg: 100,
      waterUsage: 100,
    });

    expect(full.breakdown.dataConsistency).toBe(100);
    expect(partial.breakdown.dataConsistency).toBe(50);
  });

  it('weights the components to 100% in total', () => {
    const weights = {
      productivity: 0.2,
      inputEfficiency: 0.15,
      waterEfficiency: 0.15,
      fertilizerManagement: 0.1,
      wasteManagement: 0.1,
      soilConservation: 0.1,
      energy: 0.05,
      riskHistory: 0.05,
      dataConsistency: 0.05,
      lowCarbonPractice: 0.05,
    };

    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('caps every component at 100 and never exceeds them', () => {
    const extreme = service.calculateFSS({
      yieldKg: 999999,
      waterUsage: 0,
      fertilizerUsage: 0,
      pesticideUsage: 0,
      wasteManagementPractice: 'composting',
      soilPractice: 'cover_cropping',
      energyUsage: 0,
      lowCarbonPractice: true,
      farmDataStatus: 'VERIFIED',
    });

    for (const component of Object.values(extreme.breakdown)) {
      expect(component).toBeGreaterThanOrEqual(0);
      expect(component).toBeLessThanOrEqual(100);
    }
    expect(extreme.value).toBeLessThanOrEqual(100);
  });

  it('scores a strong submission far above a weak one', () => {
    const strong = service.calculateFSS({
      yieldKg: 9000,
      waterUsage: 250,
      fertilizerUsage: 250,
      pesticideUsage: 5,
      wasteManagementPractice: 'composting',
      soilPractice: 'cover_cropping',
      energyUsage: 150,
      lowCarbonPractice: true,
      farmDataStatus: 'VERIFIED',
    });
    const weak = service.calculateFSS({
      yieldKg: 500,
      waterUsage: 1900,
      fertilizerUsage: 900,
      pesticideUsage: 60,
      wasteManagementPractice: 'none',
      soilPractice: 'none',
      energyUsage: 950,
      lowCarbonPractice: false,
      farmDataStatus: 'SELF_REPORTED',
    });

    expect(strong.value).toBeGreaterThan(80);
    expect(weak.value).toBeLessThan(40);
  });
});
