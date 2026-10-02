import { Injectable } from '@nestjs/common';
import type {
  FSSBreakdown,
  FSSInput,
  FSSResult,
  IFSSService,
} from './fss.service.interface';

@Injectable()
export class FSSService implements IFSSService {
  /**
   * Calculate FSS based on PRD weighting:
   * - Productivity 20%
   * - Input Efficiency 15%
   * - Water Efficiency 15%
   * - Fertilizer Management 10%
   * - Waste Management 10%
   * - Soil Conservation 10%
   * - Energy 5%
   * - Risk History 5%
   * - Data Consistency 5%
   * - Low-Carbon Practice 5%
   */
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

    // Calculate each component
    const productivity = this.calculateProductivity(yieldKg);
    const inputEfficiency = this.calculateInputEfficiency(
      fertilizerUsage,
      pesticideUsage,
    );
    const waterEfficiency = this.calculateWaterEfficiency(waterUsage);
    const fertilizerManagement =
      this.calculateFertilizerManagement(fertilizerUsage);
    const wasteManagement = this.calculateWasteManagement(
      wasteManagementPractice,
    );
    const soilConservation = this.calculateSoilConservation(soilPractice);
    const energy = this.calculateEnergy(energyUsage);
    const riskHistory = this.calculateRiskHistory(farmDataStatus);
    const dataConsistency = this.calculateDataConsistency(input);
    const lowCarbonPracticeScore =
      this.calculateLowCarbonPractice(lowCarbonPractice);

    // Weight and aggregate
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
      isProvisional: farmDataStatus !== 'VERIFIED',
    };
  }

  // Component calculations with placeholder normalization

  private calculateProductivity(yieldKg?: number): number {
    if (yieldKg == null) return 0;
    // Normalize: assume reference range 0-10000 kg/season
    return Math.min(100, Math.round((yieldKg / 10000) * 100));
  }

  private calculateInputEfficiency(
    fertilizerUsage?: number,
    pesticideUsage?: number,
  ): number {
    if (fertilizerUsage == null && pesticideUsage == null) return 0;
    // Lower usage = better efficiency (normalized against reference)
    const totalInput = (fertilizerUsage || 0) + (pesticideUsage || 0);
    return Math.min(100, Math.round((10000 / (totalInput + 1)) * 100));
  }

  private calculateWaterEfficiency(waterUsage?: number): number {
    if (waterUsage == null) return 0;
    // Lower water usage = better efficiency
    return Math.min(100, Math.round((10000 / (waterUsage + 1)) * 100));
  }

  private calculateFertilizerManagement(fertilizerUsage?: number): number {
    if (fertilizerUsage == null) return 0;
    // Optimal range: assume 100-500 kg/ha is good
    if (fertilizerUsage >= 100 && fertilizerUsage <= 500) return 100;
    if (fertilizerUsage < 100) return Math.round((fertilizerUsage / 100) * 100);
    return Math.max(0, Math.round(100 - (fertilizerUsage - 500) / 10));
  }

  private calculateWasteManagement(wasteManagementPractice?: string): number {
    if (!wasteManagementPractice) return 0;
    const practices: Record<string, number> = {
      composting: 100,
      recycling: 80,
      incineration: 60,
      landfill: 40,
      none: 20,
    };
    return practices[wasteManagementPractice.toLowerCase()] ?? 50;
  }

  private calculateSoilConservation(soilPractice?: string): number {
    if (!soilPractice) return 0;
    const practices: Record<string, number> = {
      cover_cropping: 100,
      crop_rotation: 90,
      no_till: 85,
      reduced_till: 70,
      conventional: 50,
      none: 30,
    };
    return practices[soilPractice.toLowerCase()] ?? 50;
  }

  private calculateEnergy(energyUsage?: number): number {
    if (energyUsage == null) return 0;
    // Lower energy usage = better
    return Math.min(100, Math.round((10000 / (energyUsage + 1)) * 100));
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
