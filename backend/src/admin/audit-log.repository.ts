import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AuditRecord,
  CreateAuditInput,
  IAuditLogRepository,
} from './audit-log.repository.interface';

const auditSelect = {
  id: true,
  actorUserId: true,
  action: true,
  targetEntity: true,
  targetId: true,
  farmId: true,
  details: true,
  createdAt: true,
} as const;

type AuditRow = {
  id: string;
  actorUserId: string;
  // Widened to string because the columns are plain varchar. The unions are
  // enforced at the write side, where AuditAction and AuditTargetType are the
  // declared parameter types.
  action: string;
  targetEntity: string;
  targetId: string;
  farmId: string | null;
  details: string | null;
  createdAt: Date;
};

function toAuditRecord(row: AuditRow): AuditRecord {
  return {
    id: row.id,
    actorId: row.actorUserId,
    action: row.action as AuditRecord['action'],
    targetType: row.targetEntity as AuditRecord['targetType'],
    targetId: row.targetId,
    farmId: row.farmId ?? undefined,
    details: row.details ?? undefined,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: CreateAuditInput): Promise<AuditRecord> {
    const row = await this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorId,
        action: input.action,
        targetEntity: input.targetType,
        targetId: input.targetId,
        farmId: input.farmId,
        details: input.details,
      },
      select: auditSelect,
    });
    return toAuditRecord(row);
  }

  async findByFarmId(farmId: string): Promise<AuditRecord[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      select: auditSelect,
    });
    return rows.map(toAuditRecord);
  }

  async findAll(): Promise<AuditRecord[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      select: auditSelect,
    });
    return rows.map(toAuditRecord);
  }
}
