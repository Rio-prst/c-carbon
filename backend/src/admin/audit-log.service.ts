import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

export type AuditAction =
  | 'FARM_DATA_REVIEWED'
  | 'FARM_DATA_VERIFIED'
  | 'FARM_DATA_REJECTED'
  | 'EVIDENCE_REVIEWED';

export type AuditRecord = {
  id: string;
  actorId: string;
  action: AuditAction;
  targetType: 'FARM_DATA' | 'EVIDENCE';
  targetId: string;
  farmId: string;
  details?: string;
  createdAt: Date;
};

export type CreateAuditInput = Omit<AuditRecord, 'id' | 'createdAt'>;

/**
 * In-memory audit log for MVP. Sensitive admin actions must leave a record,
 * so every verification and rejection writes one.
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
