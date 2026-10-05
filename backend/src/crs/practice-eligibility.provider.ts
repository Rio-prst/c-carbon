import { Injectable } from '@nestjs/common';

/**
 * Decides whether a recorded practice counts toward carbon readiness.
 *
 * MVP deliberately keeps this narrow: a practice is eligible when it is a
 * recognised low-carbon practice. Methodology-specific eligibility (which
 * crops qualify under which methodology) is still TBD, so this provider
 * reports itself provisional and every CRS built on it stays provisional.
 */
import type { IPracticeEligibilityProvider } from './practice-eligibility.provider.interface';

@Injectable()
export class PracticeEligibilityProvider implements IPracticeEligibilityProvider {
  readonly isProvisional = true;

  private readonly eligibleSoilPractices = new Set([
    'cover_cropping',
    'crop_rotation',
    'no_till',
    'reduced_till',
  ]);

  private readonly eligibleWastePractices = new Set([
    'composting',
    'recycling',
  ]);

  isSoilPracticeEligible(practice?: string): boolean {
    if (!practice) return false;
    return this.eligibleSoilPractices.has(practice.trim().toLowerCase());
  }

  isWastePracticeEligible(practice?: string): boolean {
    if (!practice) return false;
    return this.eligibleWastePractices.has(practice.trim().toLowerCase());
  }
}
