import { Injectable } from '@nestjs/common';
import type {
  CriterionResult,
  EligibilityFarm,
  EligibilitySubmission,
  EligibilityVerdict,
  IProjectEligibilityProvider,
} from './project-eligibility.provider.interface';

/**
 * Decides whether a farm may be aggregated into a carbon project.
 *
 * docs/BUSINESS-RULES.md §7 lists five conditions: data completeness, baseline,
 * verification readiness, practice, and aggregation suitability. Four are
 * checked here. Baseline is deliberately not a gate.
 *
 * `baseline_availability` is reported as unassessable by the CRS service
 * because MVP has no baseline entity, no emission factors and no methodology.
 * Gating on it would mean no farm is ever eligible and aggregation can never
 * succeed, so a project would be impossible to demonstrate. Instead the gap is
 * returned in `notAssessed` and every verdict is marked provisional, so the
 * product can report eligibility against the conditions it can evaluate
 * without asserting that a farm is carbon-credit eligible.
 *
 * This mirrors CRSResult.unavailable: report what cannot be measured rather
 * than scoring it as zero.
 */
@Injectable()
export class ProjectEligibilityProvider implements IProjectEligibilityProvider {
  readonly isProvisional = true;
  readonly minEligibleFarms = 3;
  readonly minLandAreaHa = 1;

  private readonly requiredFields = [
    'yieldKg',
    'waterUsage',
    'fertilizerUsage',
    'pesticideUsage',
    'energyUsage',
  ] as const;

  evaluate(
    farm: EligibilityFarm,
    submissions: EligibilitySubmission[],
  ): EligibilityVerdict {
    const criteria: CriterionResult[] = [
      this.checkVerification(submissions),
      this.checkDataCompleteness(submissions),
      this.checkEligiblePractice(submissions),
      this.checkAggregationSuitability(farm),
    ];

    return {
      eligible: criteria.every((criterion) => criterion.passed),
      criteria,
      notAssessed: [
        {
          component: 'baseline_availability',
          reason: 'Penentuan baseline belum tersedia di MVP',
        },
      ],
      isProvisional: this.isProvisional,
    };
  }

  private checkVerification(
    submissions: EligibilitySubmission[],
  ): CriterionResult {
    const verified = submissions.filter(
      (submission) => submission.status === 'VERIFIED',
    );

    return {
      key: 'verification',
      passed: verified.length > 0,
      reason:
        verified.length > 0
          ? `${verified.length} data sudah diverifikasi admin`
          : 'Belum ada data yang diverifikasi admin',
    };
  }

  private checkDataCompleteness(
    submissions: EligibilitySubmission[],
  ): CriterionResult {
    const verified = submissions.filter(
      (submission) => submission.status === 'VERIFIED',
    );

    if (verified.length === 0) {
      return {
        key: 'data_completeness',
        passed: false,
        reason: 'Tidak ada data terverifikasi untuk dinilai',
      };
    }

    const missing = this.requiredFields.filter((field) =>
      verified.some((submission) => submission[field] === undefined),
    );

    return {
      key: 'data_completeness',
      passed: missing.length === 0,
      reason:
        missing.length === 0
          ? 'Kelengkapan data terverifikasi mencukupi'
          : `Kolom belum terisi pada data terverifikasi: ${missing.join(', ')}`,
    };
  }

  private checkEligiblePractice(
    submissions: EligibilitySubmission[],
  ): CriterionResult {
    const verified = submissions.filter(
      (submission) => submission.status === 'VERIFIED',
    );

    const eligibleSoil = [
      'cover_cropping',
      'crop_rotation',
      'no_till',
      'reduced_till',
    ];
    const eligibleWaste = ['composting', 'recycling'];

    const normalize = (value?: string) => value?.trim().toLowerCase();

    const hasEligibleSoil = verified.some((submission) =>
      eligibleSoil.includes(normalize(submission.soilPractice) ?? ''),
    );
    const hasEligibleWaste = verified.some((submission) =>
      eligibleWaste.includes(
        normalize(submission.wasteManagementPractice) ?? '',
      ),
    );

    if (hasEligibleSoil && hasEligibleWaste) {
      return {
        key: 'eligible_practice',
        passed: true,
        reason: 'Praktik tanah dan pengelolaan limbah eligible tercatat',
      };
    }

    const missing: string[] = [];
    if (!hasEligibleSoil) missing.push('praktik tanah');
    if (!hasEligibleWaste) missing.push('pengelolaan limbah');
    if (verified.length === 0) {
      return {
        key: 'eligible_practice',
        passed: false,
        reason: 'Tidak ada data terverifikasi untuk dinilai',
      };
    }

    return {
      key: 'eligible_practice',
      passed: false,
      reason: `Belum ada ${missing.join(' dan ')} yang eligible`,
    };
  }

  private checkAggregationSuitability(farm: EligibilityFarm): CriterionResult {
    return {
      key: 'aggregation_suitability',
      passed: farm.landAreaHa >= this.minLandAreaHa,
      reason:
        farm.landAreaHa >= this.minLandAreaHa
          ? `Luas ${farm.landAreaHa} ha memenuhi ambang minimum`
          : `Luas ${farm.landAreaHa} ha di bawah ambang ${this.minLandAreaHa} ha`,
    };
  }
}
