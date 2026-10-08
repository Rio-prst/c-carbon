import type {
  IEvidenceRepository,
  IFarmDataRepository,
} from '../farm-data/farm-data.repository.interface';
import {
  InMemoryFarmDataRepository,
  InMemoryEvidenceRepository,
} from '../testing/in-memory-farm-data.repository';
import { jest } from '@jest/globals';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { ReadinessService } from './readiness.service';
import { CRSService } from './crs.service';
import type { IScoreRepository } from '../scoring/score.repository.interface';
import { InMemoryScoreRepository } from '../testing/in-memory-score.repository';
import type { FarmDataRecord } from '../farm-data/farm-data.repository.interface';
import type { CRSResult, ICRSService } from './crs.service.interface';

const OWNER: JwtPayload = { sub: 'farmer-1', role: 'FARMER' };
const ADMIN: JwtPayload = { sub: 'admin-1', role: 'ADMIN' };
const FARM_ID = 'farm-1';

const farm = {
  id: FARM_ID,
  userId: OWNER.sub,
  landAreaHa: 2.5,
  lat: -6.9,
  lng: 107.6,
  commodity: 'Karet',
};

function result(overrides: Partial<CRSResult> = {}): CRSResult {
  return {
    value: 68,
    breakdown: {
      eligible_practice: 100,
      data_completeness: 80,
      baseline_availability: 0,
      verification_readiness: 50,
      aggregation_suitability: 100,
    },
    unavailable: [
      { component: 'baseline_availability', reason: 'Belum tersedia di MVP' },
    ],
    isProvisional: true,
    nextActions: [],
    ...overrides,
  };
}

describe('ReadinessService', () => {
  let service: ReadinessService;
  let dataRepository: IFarmDataRepository;
  let evidenceRepository: IEvidenceRepository;
  let scoreRepository: IScoreRepository;
  let crsService: CRSService;
  let calculateCRS: jest.SpiedFunction<ICRSService['calculateCRS']>;
  let farmsService: {
    resolveAccess: jest.Mock<
      (user: JwtPayload, farmId: string) => Promise<unknown>
    >;
  };

  beforeEach(() => {
    dataRepository = new InMemoryFarmDataRepository();
    evidenceRepository = new InMemoryEvidenceRepository();
    scoreRepository = new InMemoryScoreRepository();
    crsService = new CRSService({
      isProvisional: true,
      isSoilPracticeEligible: () => true,
      isWastePracticeEligible: () => true,
    });
    farmsService = {
      resolveAccess:
        jest.fn<(user: JwtPayload, farmId: string) => Promise<unknown>>(),
    };
    farmsService.resolveAccess.mockResolvedValue(farm);

    calculateCRS = jest
      .spyOn(crsService, 'calculateCRS')
      .mockImplementation(() => Promise.resolve(result()));

    service = new ReadinessService(
      crsService,
      scoreRepository,
      dataRepository,
      evidenceRepository,
      farmsService as never,
    );
  });

  it('keeps the CRS disclaimer on every response', async () => {
    const response = await service.getReadiness(OWNER, FARM_ID);

    expect(response.disclaimer).toContain('bukan kredit karbon');
    expect(response.crs_value).toBe(68);
  });

  /**
   * A GET must not churn the store on every read: a farmer refreshing the
   * screen would otherwise overwrite the score and its calculated-at each time.
   */
  it('does not rewrite an unchanged CRS on a repeat read', async () => {
    await service.getReadiness(OWNER, FARM_ID);
    const first = await scoreRepository.findByFarmId(FARM_ID, 'CRS');

    await service.getReadiness(OWNER, FARM_ID);

    const second = await scoreRepository.findByFarmId(FARM_ID, 'CRS');
    expect(second?.calculatedAt).toBe(first?.calculatedAt);
    expect(second?.id).toBe(first?.id);
  });

  it('still records a CRS that actually changed', async () => {
    await service.getReadiness(OWNER, FARM_ID);
    const first = await scoreRepository.findByFarmId(FARM_ID, 'CRS');

    calculateCRS.mockImplementation(() =>
      Promise.resolve(result({ value: 91 })),
    );

    await service.getReadiness(OWNER, FARM_ID);

    const second = await scoreRepository.findByFarmId(FARM_ID, 'CRS');
    expect(second?.value).toBe(91);
    expect(second?.id).not.toBe(first?.id);
  });

  it('persists the CRS breakdown under its own component keys', async () => {
    await service.getReadiness(OWNER, FARM_ID);

    const stored = await scoreRepository.findByFarmId(FARM_ID, 'CRS');
    expect(stored?.breakdown.eligible_practice).toBe(100);
    expect(stored?.breakdown.verification_readiness).toBe(50);
  });

  it('refuses a farm the farmer does not own', async () => {
    farmsService.resolveAccess.mockRejectedValue(new Error('not found'));

    await expect(service.getReadiness(OWNER, 'farm-other')).rejects.toThrow();
    expect(calculateCRS).not.toHaveBeenCalled();
  });

  /**
   * Admin review and carbon eligibility both need another farmer's readiness.
   * This is the case that returned 404 before the ownership bypass existed.
   */
  it('lets an admin read a readiness score they do not own', async () => {
    const response = await service.getReadiness(ADMIN, FARM_ID);

    expect(response.crs_value).toBe(68);
    expect(farmsService.resolveAccess.mock.calls[0]).toEqual([ADMIN, FARM_ID]);
  });

  it('counts evidence across every submission of the farm', async () => {
    const season: FarmDataRecord = await dataRepository.create({
      farmId: FARM_ID,
      farmSeasonId: 'season-1',
      yieldKg: 1000,
    });

    await evidenceRepository.create({
      farmDataId: season.id,
      type: 'FIELD_PHOTO',
    });
    await evidenceRepository.create({
      farmDataId: season.id,
      type: 'DOCUMENT',
    });

    await service.getReadiness(OWNER, FARM_ID);

    const input = calculateCRS.mock.calls[0]?.[0];
    expect(input?.evidenceCount).toBe(2);
  });
});
