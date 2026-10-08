export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

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
   * is no single farm to point at.
   */
  farmId?: string;
  details?: string;
  createdAt: Date;
};

export type CreateAuditInput = Omit<AuditRecord, 'id' | 'createdAt'>;

/**
 * Append-only store for sensitive actions.
 *
 * docs/DATABASE.md §13 requires this to be persisted. While it was an array in
 * a service, every verification, rejection and project lifecycle change left no
 * trace after a restart, which is exactly when an audit record matters most.
 */
export interface IAuditLogRepository {
  record(input: CreateAuditInput): Promise<AuditRecord>;

  findByFarmId(farmId: string): Promise<AuditRecord[]>;

  /** Newest first, so the admin endpoint reads chronologically. */
  findAll(): Promise<AuditRecord[]>;
}
