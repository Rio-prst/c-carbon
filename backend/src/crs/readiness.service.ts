import { Inject, Injectable } from '@nestjs/common';
import {
  CRS_SERVICE,
  type CRSResult,
  type ICRSService,
} from './crs.service.interface';
import {
  FARM_DATA_REPOSITORY,
  type IFarmDataRepository,
} from '../farm-data/farm-data.repository.interface';
import {
  EVIDENCE_REPOSITORY,
  type IEvidenceRepository,
} from '../farm-data/farm-data.repository.interface';
import { FarmsService } from '../farms/farms.service';
import {
  SCORE_REPOSITORY,
  type IScoreRepository,
} from '../scoring/score.repository.interface';
import type { JwtPayload } from '../auth/types/jwt-payload';

export type CRSResponse = {
  crs_value: number;
  is_provisional: boolean;
  breakdown: Record<string, number>;
  unavailable: { component: string; reason: string }[];
  next_actions: string[];
  /**
   * CRS is an internal readiness indicator. The API must not imply carbon
   * credit was issued or that the farm is enrolled in a project.
   */
  disclaimer: string;
};

const DISCLAIMER =
  'CRS adalah indikator kesiapan internal, bukan kredit karbon. Keanggotaan proyek belum dapat dipastikan.';

@Injectable()
export class ReadinessService {
  constructor(
    @Inject(CRS_SERVICE)
    private readonly crsService: ICRSService,
    @Inject(SCORE_REPOSITORY)
    private readonly scoreRepository: IScoreRepository,
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    @Inject(EVIDENCE_REPOSITORY)
    private readonly evidenceRepository: IEvidenceRepository,
    private readonly farmsService: FarmsService,
  ) {}

  async getReadiness(user: JwtPayload, farmId: string): Promise<CRSResponse> {
    const farm = await this.farmsService.resolveAccess(user, farmId);

    const farmData = await this.farmDataRepository.findByFarmId(farmId);

    let evidenceCount = 0;
    for (const data of farmData) {
      evidenceCount += (await this.evidenceRepository.findByFarmDataId(data.id))
        .length;
    }

    const result = await this.crsService.calculateCRS({
      farmId,
      farmData: farmData.map((data) => ({
        soilPractice: data.soilPractice,
        wasteManagementPractice: data.wasteManagementPractice,
        lowCarbonPractice: data.lowCarbonPractice,
        status: data.status,
        yieldKg: data.yieldKg,
        waterUsage: data.waterUsage,
        fertilizerUsage: data.fertilizerUsage,
        pesticideUsage: data.pesticideUsage,
        energyUsage: data.energyUsage,
      })),
      evidenceCount,
      farm: {
        landAreaHa: farm.landAreaHa,
        lat: farm.lat,
        lng: farm.lng,
        commodity: farm.commodity,
      },
    });

    await this.persistIfChanged(farmId, result);

    return this.serialize(result);
  }

  /**
   * Caches the CRS so the persisted score can be read without recomputing it.
   *
   * This endpoint is a GET, so it must not write on every call: a farmer
   * refreshing the screen would otherwise churn the store and reset the
   * calculated-at timestamp each time. The value and the provisional flag are
   * compared, so a genuine change from farm data or evidence is still recorded
   * while a repeat read is a no-op.
   *
   * Recalculation stays triggered by data changes, the same path FSS uses.
   */
  private async persistIfChanged(
    farmId: string,
    result: CRSResult,
  ): Promise<void> {
    const stored = await this.scoreRepository.findByFarmId(farmId, 'CRS');
    if (
      stored &&
      stored.value === result.value &&
      stored.isProvisional === result.isProvisional
    ) {
      return;
    }

    await this.scoreRepository.save({
      farmId,
      scoreType: 'CRS',
      value: result.value,
      breakdown: result.breakdown,
      isProvisional: result.isProvisional,
    });
  }

  private serialize(result: CRSResult): CRSResponse {
    return {
      crs_value: result.value,
      is_provisional: result.isProvisional,
      breakdown: { ...result.breakdown },
      unavailable: result.unavailable.map((entry) => ({ ...entry })),
      next_actions: [...result.nextActions],
      disclaimer: DISCLAIMER,
    };
  }
}
