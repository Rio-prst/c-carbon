import { randomUUID } from 'node:crypto';
import type {
  CreateInsuranceInput,
  IInsuranceRepository,
  InsuranceRecord,
} from '../insurance/insurance.repository.interface';

/**
 * Test double for the insurance port.
 *
 * Holds several policies per farm and returns the most recent, matching the
 * Prisma implementation where docs/DATABASE.md §6 specifies farm 1:N.
 */
export class InMemoryInsuranceRepository implements IInsuranceRepository {
  private readonly byFarm = new Map<string, InsuranceRecord[]>();

  findByFarmId(farmId: string): Promise<InsuranceRecord | null> {
    const history = this.byFarm.get(farmId) ?? [];
    return Promise.resolve(history[0] ?? null);
  }

  /**
   * Test-only. The production repository deliberately does not expose this:
   * farm 1:N means "how many rows are there" is not a question the application
   * asks. A test does ask it, because duplication is invisible through
   * findByFarmId, which returns the newest row either way.
   */
  countByFarmId(farmId: string): number {
    return (this.byFarm.get(farmId) ?? []).length;
  }

  create(input: CreateInsuranceInput): Promise<InsuranceRecord> {
    const now = new Date();
    const record: InsuranceRecord = {
      id: randomUUID(),
      farmId: input.farmId,
      partner: input.partner,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    const history = this.byFarm.get(input.farmId) ?? [];
    history.unshift(record);
    this.byFarm.set(input.farmId, history);
    return Promise.resolve(record);
  }
}
