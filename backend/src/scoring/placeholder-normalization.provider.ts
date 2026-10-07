import { Injectable } from '@nestjs/common';
import type {
  INormalizationProvider,
  ReferenceRange,
} from './normalization.provider.interface';

const PRACTICE_SCORES: Record<
  'waste_management' | 'soil_conservation',
  Record<string, number>
> = {
  waste_management: {
    composting: 100,
    recycling: 80,
    incineration: 60,
    landfill: 40,
    none: 20,
  },
  soil_conservation: {
    cover_cropping: 100,
    crop_rotation: 90,
    no_till: 85,
    reduced_till: 70,
    conventional: 50,
    none: 30,
  },
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

/** Linear ramp from `worst` to `best`, for a higher-is-better metric. */
function increasing(value: number, worst: number, best: number): number {
  if (best === worst) return 100;
  return clamp(((value - worst) / (best - worst)) * 100);
}

/** Linear ramp from `worst` to `best`, for a lower-is-better metric. */
function decreasing(value: number, worst: number, best: number): number {
  if (best === worst) return 100;
  return clamp(((worst - value) / (worst - best)) * 100);
}

/**
 * Placeholder ranges used until commodity-specific agronomic references are
 * agreed. Everything scored through this provider is reported as provisional.
 *
 * The previous implementation divided by a fixed 10000 and clamped, which
 * returned a perfect score for nearly every realistic reading. These ramps
 * are monotone across the whole plausible range so the breakdown carries
 * usable signal while the real ranges are still TBD.
 */
@Injectable()
export class PlaceholderNormalizationProvider implements INormalizationProvider {
  readonly isProvisional = true;

  private readonly ranges: Record<string, ReferenceRange> = {
    yield: {
      source: 'Placeholder,commodity reference TBD',
      direction: 'higher_is_better',
      worst: 0,
      best: 10000,
    },
    waterUsage: {
      source: 'Placeholder,commodity reference TBD',
      direction: 'lower_is_better',
      worst: 2000,
      best: 200,
    },
    inputTotal: {
      // Kept consistent with the fertilizerManagement band on purpose: a farm
      // at the top of the optimal fertilizer band sits mid-range here rather
      // than being penalised twice for the same reading.
      source: 'Placeholder,commodity reference TBD',
      direction: 'lower_is_better',
      worst: 600,
      best: 60,
    },
    fertilizerManagement: {
      source: 'Placeholder,assumed optimal band',
      direction: 'higher_is_better',
      worst: 100,
      best: 500,
      optimal: 300,
    },
    energyUsage: {
      source: 'Placeholder,commodity reference TBD',
      direction: 'lower_is_better',
      worst: 1000,
      best: 100,
    },
  };

  productivity(yieldKg: number): number {
    return increasing(yieldKg, this.ranges.yield.worst, this.ranges.yield.best);
  }

  waterEfficiency(waterUsage: number): number {
    return decreasing(
      waterUsage,
      this.ranges.waterUsage.worst,
      this.ranges.waterUsage.best,
    );
  }

  inputEfficiency(fertilizerUsage: number, pesticideUsage: number): number {
    return decreasing(
      fertilizerUsage + pesticideUsage,
      this.ranges.inputTotal.worst,
      this.ranges.inputTotal.best,
    );
  }

  fertilizerManagement(fertilizerUsage: number): number {
    const { worst, best } = this.ranges.fertilizerManagement;
    // Inside the assumed optimal band the score stays at 100, so neither
    // under- nor over-application is rewarded. Outside the band the score
    // ramps away, reaching 0 at zero application and at twice the band.
    if (fertilizerUsage >= worst && fertilizerUsage <= best) return 100;
    if (fertilizerUsage < worst) {
      return increasing(fertilizerUsage, 0, worst);
    }
    return decreasing(fertilizerUsage, best, best * 2);
  }

  energy(energyUsage: number): number {
    return decreasing(
      energyUsage,
      this.ranges.energyUsage.worst,
      this.ranges.energyUsage.best,
    );
  }

  practiceScore(
    practice: string,
    kind: 'waste_management' | 'soil_conservation',
  ): number | null {
    return PRACTICE_SCORES[kind][practice.trim().toLowerCase()] ?? null;
  }

  referenceRanges(): ReferenceRange[] {
    return Object.values(this.ranges);
  }
}
