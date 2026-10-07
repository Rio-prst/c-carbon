import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type AuditAction =
  | 'FARM_DATA_REVIEWED'
  | 'FARM_DATA_VERIFIED'
  | 'FARM_DATA_REJECTED'
  | 'EVIDENCE_REVIEWED'
  | 'CARBON_PROJECT_CREATED'
  | 'CARBON_PROJECT_STATUS_CHANGED'
  | 'CARBON_PROJECT_AGGREGATED';

export type AuditTargetType = 'FARM_DATA' | 'EVIDENCE' | 'CARBON_PROJECT';

export type AuditRecord = {
  id: string;
  actorId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  /**
   * Absent for project lifecycle actions: a project spans many farms, so there
   * is no single farm to point at. Keeping it optional rather than nullable lets
   * `findByFarmId` stay a plain filter.
   */
  farmId?: string;
  details?: string;
  createdAt: Date;
};

export type CreateAuditInput = Omit<AuditRecord, 'id' | 'createdAt'>;

/**
 * In-memory audit log for MVP. Sensitive admin actions must leave a record,
 * so every verification, rejection and project lifecycle change writes one.
 *
 * In-memory means entries are lost on restart. docs/DATABASE.md §13 specifies
 * a persisted audit_logs table, which is still open work.
 */
@Injectable()
export class AuditLog {
  private readonly records: AuditRecord[] = [];

  record(input: CreateAuditInput): Promise<AuditRecord> {
    const entry: AuditRecord = {
      id: randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.records.push(entry);
    return Promise.resolve(entry);
  }

  findByFarmId(farmId: string): Promise<AuditRecord[]> {
    return Promise.resolve(this.records.filter((r) => r.farmId === farmId));
  }

  findAll(): Promise<AuditRecord[]> {
    return Promise.resolve([...this.records]);
  }
}
