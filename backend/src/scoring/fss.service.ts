import { Inject, Injectable } from '@nestjs/common';
import type {
  FSSBreakdown,
  FSSInput,
  FSSResult,
  IFSSService,
} from './fss.service.interface';
import {
  NORMALIZATION_PROVIDER,
  type INormalizationProvider,
} from './normalization.provider.interface';

/**
 * FSS weighting per PRD:
 * productivity 20%, input efficiency 15%, water efficiency 15%,
 * fertilizer management 10%, waste management 10%, soil conservation 10%,
 * energy 5%, risk history 5%, data consistency 5%, low-carbon practice 5%.
 *
 * Scoring itself stays here; the mapping from raw readings to 0-100 lives in
 * the injected normalization provider so the reference ranges can be replaced
 * without touching the weighting.
 */
@Injectable()
export class FSSService implements IFSSService {
  constructor(
    @Inject(NORMALIZATION_PROVIDER)
    private readonly normalization: INormalizationProvider,
  ) {}

  calculateFSS(input: FSSInput): FSSResult {
    const {
      yieldKg,
      waterUsage,
      fertilizerUsage,
      pesticideUsage,
      wasteManagementPractice,
      soilPractice,
      energyUsage,
      lowCarbonPractice,
      farmDataStatus,
    } = input;

    const productivity = this.score(yieldKg, (v) =>
      this.normalization.productivity(v),
    );
    const inputEfficiency = this.scoreBoth(
      fertilizerUsage,
      pesticideUsage,
      (f, p) => this.normalization.inputEfficiency(f, p),
    );
    const waterEfficiency = this.score(waterUsage, (v) =>
      this.normalization.waterEfficiency(v),
    );
    const fertilizerManagement = this.score(fertilizerUsage, (v) =>
      this.normalization.fertilizerManagement(v),
    );
    const wasteManagement = this.scorePractice(
      wasteManagementPractice,
      'waste_management',
    );
    const soilConservation = this.scorePractice(
      soilPractice,
      'soil_conservation',
    );
    const energy = this.score(energyUsage, (v) => this.normalization.energy(v));
    const riskHistory = this.calculateRiskHistory(farmDataStatus);
    const dataConsistency = this.calculateDataConsistency(input);
    const lowCarbonPracticeScore =
      this.calculateLowCarbonPractice(lowCarbonPractice);

    const value = Math.round(
      productivity * 0.2 +
        inputEfficiency * 0.15 +
        waterEfficiency * 0.15 +
        fertilizerManagement * 0.1 +
        wasteManagement * 0.1 +
        soilConservation * 0.1 +
        energy * 0.05 +
        riskHistory * 0.05 +
        dataConsistency * 0.05 +
        lowCarbonPracticeScore * 0.05,
    );

    const breakdown: FSSBreakdown = {
      productivity,
      inputEfficiency,
      waterEfficiency,
      fertilizerManagement,
      wasteManagement,
      soilConservation,
      energy,
      riskHistory,
      dataConsistency,
      lowCarbonPractice: lowCarbonPracticeScore,
    };

    return {
      value: Math.max(0, Math.min(100, value)),
      breakdown,
      isProvisional:
        this.normalization.isProvisional || farmDataStatus !== 'VERIFIED',
    };
  }

  /** A missing reading scores 0 rather than being treated as a good value. */
  private score(
    value: number | undefined,
    normalize: (value: number) => number,
  ): number {
    return value == null ? 0 : normalize(value);
  }

  private scoreBoth(
    first: number | undefined,
    second: number | undefined,
    normalize: (first: number, second: number) => number,
  ): number {
    return first == null && second == null
      ? 0
      : normalize(first ?? 0, second ?? 0);
  }

  /**
   * An unknown practice name is not silently scored as neutral, because that
   * would let a typo look like a middling result. It scores 0 and the
   * breakdown stays honest about not knowing the practice.
   */
  private scorePractice(
    practice: string | undefined,
    kind: 'waste_management' | 'soil_conservation',
  ): number {
    if (!practice) return 0;
    return this.normalization.practiceScore(practice, kind) ?? 0;
  }

  private calculateRiskHistory(farmDataStatus?: string): number {
    if (!farmDataStatus) return 50;
    if (farmDataStatus === 'VERIFIED') return 100;
    if (farmDataStatus === 'REJECTED') return 30;
    return 70;
  }

  private calculateDataConsistency(input: FSSInput): number {
    const fields = [
      input.yieldKg,
      input.waterUsage,
      input.fertilizerUsage,
      input.pesticideUsage,
    ];
    const filledCount = fields.filter((f) => f != null).length;
    const totalCount = fields.length;
    return Math.round((filledCount / totalCount) * 100);
  }

  private calculateLowCarbonPractice(lowCarbonPractice?: boolean): number {
    if (lowCarbonPractice == null) return 0;
    return lowCarbonPractice ? 100 : 50;
  }
}
