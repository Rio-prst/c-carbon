import { randomUUID } from 'node:crypto';
import type {
  AuditRecord,
  CreateAuditInput,
  IAuditLogRepository,
} from '../admin/audit-log.repository.interface';

/**
 * In-memory stand-in for the audit log.
 *
 * The real repository is Prisma-backed. Service tests exercise who calls
 * record() and with what, which needs no database, and booting Prisma for a
 * service test would break the rule that the test database stays untouched by
 * unit runs.
 */
export class InMemoryAuditLogRepository implements IAuditLogRepository {
  readonly entries: AuditRecord[] = [];

  record(input: CreateAuditInput): Promise<AuditRecord> {
    const entry: AuditRecord = {
      id: randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.entries.push(entry);
    return Promise.resolve(entry);
  }

  findByFarmId(farmId: string): Promise<AuditRecord[]> {
    return Promise.resolve(this.entries.filter((e) => e.farmId === farmId));
  }

  findAll(): Promise<AuditRecord[]> {
    return Promise.resolve([...this.entries]);
  }
}
