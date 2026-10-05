import { CRSService } from './crs.service';
import { PracticeEligibilityProvider } from './practice-eligibility.provider';
import { CRS_WEIGHTS, type CRSInput } from './crs.service.interface';

const READY_FARM = {
  landAreaHa: 5,
  lat: -6.9175,
  lng: 107.6191,
  commodity: 'Padi',
};

const COMPLETE_ENTRY = {
  soilPractice: 'cover_cropping',
  wasteManagementPractice: 'composting',
  lowCarbonPractice: true,
  status: 'VERIFIED',
  yieldKg: 4200,
  waterUsage: 800,
  fertilizerUsage: 200,
  pesticideUsage: 10,
  energyUsage: 300,
};

describe('CRSService', () => {
  let service: CRSService;
  let provider: PracticeEligibilityProvider;

  beforeEach(() => {
    provider = new PracticeEligibilityProvider();
    service = new CRSService(provider);
  });

  const build = (input: Partial<CRSInput> = {}): CRSInput => ({
    farmId: 'farm-1',
    farmData: [COMPLETE_ENTRY],
    evidenceCount: 1,
    farm: READY_FARM,
    ...input,
  });

  it('stays within 0-100', async () => {
    const result = await service.calculateCRS(build());

    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(100);
  });

  it('reports a missing baseline as unavailable rather than as zero', async () => {
    const result = await service.calculateCRS(build());

    const baseline = result.unavailable.find(
      (entry) => entry.component === 'baseline_availability',
    );
    expect(baseline).toBeDefined();
    expect(baseline?.reason).toContain('baseline');
    // The component is still reported in the breakdown, but it must not have
    // dragged the weighted average down as a zero.
    expect(result.value).toBeGreaterThan(0);
  });

  it('excludes unavailable components from the weighted average', async () => {
    const ready = await service.calculateCRS(build());
    const empty = await service.calculateCRS(
      build({ farmData: [], evidenceCount: 0 }),
    );

    expect(empty.isProvisional).toBe(true);
    expect(empty.nextActions.length).toBeGreaterThan(0);
    expect(ready.value).toBeGreaterThan(empty.value);
  });

  it('stays provisional because baseline cannot be assessed', async () => {
    const result = await service.calculateCRS(build());

    expect(result.isProvisional).toBe(true);
  });

  it('scores eligible practice fully when all practices qualify', async () => {
    const result = await service.calculateCRS(build());

    expect(result.breakdown.eligible_practice).toBe(100);
  });

  it('scores eligible practice lower when a practice does not qualify', async () => {
    const result = await service.calculateCRS(
      build({
        farmData: [
          {
            ...COMPLETE_ENTRY,
            soilPractice: 'conventional',
            wasteManagementPractice: 'landfill',
            lowCarbonPractice: false,
          },
        ],
      }),
    );

    // None of the three practice signals qualify.
    expect(result.breakdown.eligible_practice).toBe(0);
  });

  it('counts only the qualifying practice signals', async () => {
    const result = await service.calculateCRS(
      build({
        farmData: [
          {
            ...COMPLETE_ENTRY,
            soilPractice: 'conventional',
            wasteManagementPractice: 'landfill',
          },
        ],
      }),
    );

    // Only the low-carbon flag still qualifies, one of three signals.
    expect(result.breakdown.eligible_practice).toBe(33);
  });

  it('marks eligible practice unavailable when no practice was reported', async () => {
    const result = await service.calculateCRS(
      build({
        farmData: [
          {
            ...COMPLETE_ENTRY,
            soilPractice: undefined,
            wasteManagementPractice: undefined,
          },
        ],
      }),
    );

    const entry = result.unavailable.find(
      (item) => item.component === 'eligible_practice',
    );
    expect(entry).toBeDefined();
  });

  it('scores data completeness from the filled fields', async () => {
    const full = await service.calculateCRS(build());
    const partial = await service.calculateCRS(
      build({
        farmData: [
          {
            ...COMPLETE_ENTRY,
            pesticideUsage: undefined,
            energyUsage: undefined,
            waterUsage: undefined,
          },
        ],
      }),
    );

    expect(full.breakdown.data_completeness).toBe(100);
    expect(partial.breakdown.data_completeness).toBe(40);
  });

  it('halves verification readiness when there is no evidence', async () => {
    const withEvidence = await service.calculateCRS(build());
    const withoutEvidence = await service.calculateCRS(
      build({ evidenceCount: 0 }),
    );

    expect(withEvidence.breakdown.verification_readiness).toBe(100);
    expect(withoutEvidence.breakdown.verification_readiness).toBe(50);
  });

  it('penalises verification readiness for unverified data', async () => {
    const result = await service.calculateCRS(
      build({
        farmData: [{ ...COMPLETE_ENTRY, status: 'SELF_REPORTED' }],
        evidenceCount: 1,
      }),
    );

    expect(result.breakdown.verification_readiness).toBe(0);
  });

  it('scores aggregation suitability from area, location and commodity', async () => {
    const ready = await service.calculateCRS(build());
    const weak = await service.calculateCRS(
      build({
        farm: { ...READY_FARM, landAreaHa: 0.1, commodity: '  ' },
      }),
    );

    expect(ready.breakdown.aggregation_suitability).toBe(100);
    expect(weak.breakdown.aggregation_suitability).toBeLessThan(100);
  });

  it('explains what the farmer still needs to do', async () => {
    const result = await service.calculateCRS(
      build({ farmData: [], evidenceCount: 0 }),
    );

    expect(result.nextActions).toContain(
      'Kirim data lahan beserta praktik yang diterapkan',
    );
    expect(
      result.nextActions.some((a) => a.toLowerCase().includes('baseline')),
    ).toBe(true);
  });

  it('weights components to 100% in total', () => {
    const total = Object.values(CRS_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(total).toBe(100);
  });

  it('matches practice names case-insensitively', async () => {
    const result = await service.calculateCRS(
      build({
        farmData: [
          {
            ...COMPLETE_ENTRY,
            soilPractice: 'Cover_Cropping',
            wasteManagementPractice: 'Composting',
          },
        ],
      }),
    );

    expect(result.breakdown.eligible_practice).toBe(100);
  });
});
