export type ReviewQueueItem = {
  id: string;
  farmId: string;
  farmName: string;
  digitalFarmId: string;
  commodity: string;
  farmSeasonId: string;
  submittedAt: string;
  status: string;
  yieldKg?: number;
  waterUsage?: number;
  fertilizerUsage?: number;
  pesticideUsage?: number;
  energyUsage?: number;
  wasteManagementPractice?: string;
  soilPractice?: string;
  lowCarbonPractice: boolean;
  evidenceCount: number;
};
