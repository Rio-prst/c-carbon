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

export type AuditRecord = {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  /** Absent for project lifecycle actions, which span many farms. */
  farmId?: string;
  details?: string;
  createdAt: string;
};