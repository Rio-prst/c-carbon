export const FSS_SERVICE = Symbol('FSS_SERVICE');

export interface FSSBreakdown {
  productivity: number;        // 20%
  inputEfficiency: number;     // 15%
  waterEfficiency: number;     // 15%
  fertilizerManagement: number; // 10%
  wasteManagement: number;     // 10%
  soilConservation: number;    // 10%
  energy: number;              // 5%
  riskHistory: number;         // 5%
  dataConsistency: number;     // 5%
  lowCarbonPractice: number;   // 5%
}

export interface FSSResult {
  value: number;           // 0-100
  breakdown: FSSBreakdown;
  isProvisional: boolean;
}

export interface FSSInput {
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
  pesticideUsage?: number;
  wasteManagementPractice?: string;
  soilPractice?: string;
  energyUsage?: number;
  lowCarbonPractice?: boolean;
  farmDataStatus?: string;
}

export interface IFSSService {
  calculateFSS(input: FSSInput): FSSResult;
}
