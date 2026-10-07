import { Inject, Injectable } from '@nestjs/common';
import {
  CRS_WEIGHTS,
  type CRSBreakdown,
  type CRSComponentKey,
  type CRSInput,
  type CRSResult,
  type ICRSService,
} from './crs.service.interface';
import {
  PRACTICE_ELIGIBILITY_PROVIDER,
  type IPracticeEligibilityProvider,
} from './practice-eligibility.provider.interface';

/** Fields a candidate farm is expected to have reported. */
const EXPECTED_FIELDS = [
  'yieldKg',
  'waterUsage',
  'fertilizerUsage',
  'pesticideUsage',
  'energyUsage',
] as const;

@Injectable()
export class CRSService implements ICRSService {
  constructor(
    @Inject(PRACTICE_ELIGIBILITY_PROVIDER)
    private readonly practiceEligibility: IPracticeEligibilityProvider,
  ) {}

  /**
   * CRS answers "how ready is this farm to be evaluated as a candidate carbon
   * project", not "how much carbon credit does this earn". A component that
   * cannot be assessed is reported as unavailable and excluded from the
   * average, never scored 0.
   */
  calculateCRS(input: CRSInput): Promise<CRSResult> {
    const unavailable: CRSResult['unavailable'] = [];
    const nextActions: string[] = [];
    const scores: Partial<CRSBreakdown> = {};

    const eligiblePractice = this.scoreEligiblePractice(input);
    if (eligiblePractice.score != null) {
      scores.eligible_practice = eligiblePractice.score;
      if (eligiblePractice.score < 100) {
        nextActions.push(
          'Terapkan praktik tanah dan pengelolaan sampah yang diakui untuk karbon',
        );
      }
    } else {
      unavailable.push({
        component: 'eligible_practice',
        reason: 'Belum ada data praktik lahan yang dikirim',
      });
      nextActions.push('Kirim data lahan beserta praktik yang diterapkan');
    }

    const dataCompleteness = this.scoreDataCompleteness(input);
    scores.data_completeness = dataCompleteness;
    if (dataCompleteness < 100) {
      nextActions.push('Lengkapi semua kolom data lahan yang masih kosong');
    }

    // MVP has no baseline entity, so this cannot be honestly assessed.
    unavailable.push({
      component: 'baseline_availability',
      reason: 'Penentuan baseline belum tersedia di MVP',
    });
    nextActions.push('Baseline pengukuran belum dapat ditentukan');

    const verificationReadiness = this.scoreVerificationReadiness(input);
    scores.verification_readiness = verificationReadiness;
    if (verificationReadiness < 100) {
      nextActions.push('Kirim bukti dukung agar data dapat diverifikasi admin');
    }

    const aggregationSuitability = this.scoreAggregationSuitability(input);
    scores.aggregation_suitability = aggregationSuitability;
    if (aggregationSuitability < 100) {
      nextActions.push(
        'Luas lahan dan lokasi harus memenuhi syarat agregasi proyek',
      );
    }

    const value = this.weightedAverage(scores);

    return Promise.resolve({
      value,
      breakdown: {
        eligible_practice: scores.eligible_practice ?? 0,
        data_completeness: scores.data_completeness ?? 0,
        baseline_availability: scores.baseline_availability ?? 0,
        verification_readiness: scores.verification_readiness ?? 0,
        aggregation_suitability: scores.aggregation_suitability ?? 0,
      },
      unavailable,
      isProvisional:
        unavailable.length > 0 || this.practiceEligibility.isProvisional,
      nextActions,
    });
  }

  /** Average over assessable components only, so the total stays 0-100. */
  private weightedAverage(scores: Partial<CRSBreakdown>): number {
    const keys = Object.keys(scores) as CRSComponentKey[];
    if (keys.length === 0) return 0;

    const totalWeight = keys.reduce((sum, key) => sum + CRS_WEIGHTS[key], 0);
    if (totalWeight === 0) return 0;

    const weighted = keys.reduce(
      (sum, key) => sum + (scores[key] ?? 0) * CRS_WEIGHTS[key],
      0,
    );

    return Math.max(0, Math.min(100, Math.round(weighted / totalWeight)));
  }

  private scoreEligiblePractice(input: CRSInput): { score: number | null } {
    const entries = input.farmData.filter(
      (data) =>
        data.soilPractice != null || data.wasteManagementPractice != null,
    );
    if (entries.length === 0) return { score: null };

    const latest = entries[entries.length - 1];
    const checks = [
      this.practiceEligibility.isSoilPracticeEligible(latest.soilPractice),
      this.practiceEligibility.isWastePracticeEligible(
        latest.wasteManagementPractice,
      ),
      latest.lowCarbonPractice,
    ];

    return {
      score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
    };
  }

  private scoreDataCompleteness(input: CRSInput): number {
    if (input.farmData.length === 0) return 0;

    const total = input.farmData.length * EXPECTED_FIELDS.length;
    const filled = input.farmData.reduce(
      (sum, data) =>
        sum + EXPECTED_FIELDS.filter((field) => data[field] != null).length,
      0,
    );

    return Math.round((filled / total) * 100);
  }

  private scoreVerificationReadiness(input: CRSInput): number {
    if (input.farmData.length === 0) return 0;

    const verified = input.farmData.filter(
      (data) => data.status === 'VERIFIED',
    ).length;
    const statusScore = (verified / input.farmData.length) * 100;

    // Evidence is required for a submission to be verifiable at all, so a
    // farm with data but no evidence cannot reach full readiness.
    const hasEvidence = input.evidenceCount > 0;

    return Math.round(hasEvidence ? statusScore : statusScore / 2);
  }

  /**
   * Aggregation needs a farm large enough to matter and a location precise
   * enough to group. Minimum area is still TBD, so a placeholder floor is
   * used and the component stays provisional.
   */
  private scoreAggregationSuitability(input: CRSInput): number {
    const minimumAreaHa = 1;
    const hasCoordinates =
      Number.isFinite(input.farm.lat) && Number.isFinite(input.farm.lng);
    const hasCommodity = input.farm.commodity.trim().length > 0;

    const checks = [
      input.farm.landAreaHa >= minimumAreaHa,
      hasCoordinates,
      hasCommodity,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }
}
