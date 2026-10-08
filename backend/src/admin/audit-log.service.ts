import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_LOG_REPOSITORY,
  type AuditRecord,
  type CreateAuditInput,
  type IAuditLogRepository,
} from './audit-log.repository.interface';

export type {
  AuditAction,
  AuditRecord,
  AuditTargetType,
  CreateAuditInput,
} from './audit-log.repository.interface';
export { AUDIT_LOG_REPOSITORY } from './audit-log.repository.interface';

/**
 * Records sensitive actions: every verification, rejection and project
 * lifecycle change.
 *
 * This is a thin facade over the repository so the call sites keep reading
 * `auditLog.record(...)`. The persistence moved to Postgres because
 * docs/DATABASE.md §13 requires an audit trail, and an in-memory one loses
 * every entry exactly when a restart is what you would want to investigate.
 */
@Injectable()
export class AuditLog {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly repository: IAuditLogRepository,
  ) {}

  record(input: CreateAuditInput): Promise<AuditRecord> {
    return this.repository.record(input);
  }

  findByFarmId(farmId: string): Promise<AuditRecord[]> {
    return this.repository.findByFarmId(farmId);
  }

  findAll(): Promise<AuditRecord[]> {
    return this.repository.findAll();
  }
}
