import { describe, expect, it, beforeEach } from '@jest/globals';
import { ProjectEligibilityProvider } from './project-eligibility.provider';
import type {
  CriterionResult,
  EligibilitySubmission,
  EligibilityVerdict,
} from './project-eligibility.provider.interface';

const farm = { id: 'farm-1', landAreaHa: 2.5, commodity: 'Karet' };

function submission(
  overrides: Partial<EligibilitySubmission> = {},
): EligibilitySubmission {
  return {
    status: 'VERIFIED',
    yieldKg: 4200,
    waterUsage: 900,
    fertilizerUsage: 180,
    pesticideUsage: 12,
    energyUsage: 220,
    soilPractice: 'cover_cropping',
    wasteManagementPractice: 'composting',
    lowCarbonPractice: true,
    ...overrides,
  };
}

function criterion(verdict: EligibilityVerdict, key: string): CriterionResult {
  const found = verdict.criteria.find((c) => c.key === key);
  if (!found) throw new Error(`criterion ${key} missing from verdict`);
  return found;
}

describe('ProjectEligibilityProvider', () => {
  let provider: ProjectEligibilityProvider;

  beforeEach(() => {
    provider = new ProjectEligibilityProvider();
  });

  it('accepts a fully verified farm with eligible practices', () => {
    const verdict = provider.evaluate(farm, [submission()]);

    expect(verdict.eligible).toBe(true);
    expect(verdict.criteria.every((c) => c.passed)).toBe(true);
  });

  it('rejects a farm whose data is still self-reported', () => {
    const verdict = provider.evaluate(farm, [
      submission({ status: 'SELF_REPORTED' }),
    ]);

    expect(verdict.eligible).toBe(false);
    expect(criterion(verdict, 'verification')?.passed).toBe(false);
  });

  it('rejects a farm with no submissions at all', () => {
    const verdict = provider.evaluate(farm, []);

    expect(verdict.eligible).toBe(false);
    expect(criterion(verdict, 'verification')?.passed).toBe(false);
  });

  it('rejects a farm missing a required field on verified data', () => {
    const verdict = provider.evaluate(farm, [
      submission({ energyUsage: undefined }),
    ]);

    expect(verdict.eligible).toBe(false);
    const completeness = criterion(verdict, 'data_completeness');
    expect(completeness?.passed).toBe(false);
    expect(completeness?.reason).toContain('energyUsage');
  });

  it('rejects a farm whose practices are not eligible', () => {
    const verdict = provider.evaluate(farm, [
      submission({
        soilPractice: 'conventional',
        wasteManagementPractice: 'landfill',
      }),
    ]);

    expect(verdict.eligible).toBe(false);
    expect(criterion(verdict, 'eligible_practice')?.passed).toBe(false);
  });

  it('matches practice names case-insensitively', () => {
    const verdict = provider.evaluate(farm, [
      submission({
        soilPractice: '  Cover_Cropping ',
        wasteManagementPractice: 'COMPOSTING',
      }),
    ]);

    expect(criterion(verdict, 'eligible_practice')?.passed).toBe(true);
  });

  it('rejects a farm below the minimum land area', () => {
    const verdict = provider.evaluate({ ...farm, landAreaHa: 0.4 }, [
      submission(),
    ]);

    expect(verdict.eligible).toBe(false);
    expect(criterion(verdict, 'aggregation_suitability')?.passed).toBe(false);
  });

  it('accepts a farm exactly at the minimum land area', () => {
    const verdict = provider.evaluate({ ...farm, landAreaHa: 1 }, [
      submission(),
    ]);

    expect(criterion(verdict, 'aggregation_suitability')?.passed).toBe(true);
  });

  /**
   * Baseline cannot be assessed in MVP. Gating on it would mean no farm is ever
   * eligible and aggregation could never run, so it must be reported as a gap
   * instead of silently counted as a pass or a failure.
   */
  it('reports baseline as not assessed rather than gating on it', () => {
    const verdict = provider.evaluate(farm, [submission()]);

    expect(verdict.eligible).toBe(true);
    expect(verdict.notAssessed).toHaveLength(1);
    expect(verdict.notAssessed[0].component).toBe('baseline_availability');
    // The gate keys must not include baseline, otherwise it is being scored.
    const gateKeys = verdict.criteria.map((c) => c.key);
    expect(gateKeys).not.toContain('baseline_availability');
    expect(gateKeys).toHaveLength(4);
  });

  it('stays provisional so eligibility is never read as carbon credit', () => {
    expect(provider.evaluate(farm, [submission()]).isProvisional).toBe(true);
    expect(provider.isProvisional).toBe(true);
  });

  it('needs three eligible farms before a project can aggregate', () => {
    expect(provider.minEligibleFarms).toBe(3);
  });
});
