export type InsuranceStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED';

export type Insurance = {
  id: string;
  farmId: string;
  partner: string;
  status: InsuranceStatus;
  createdAt: string;
  updatedAt: string;
};