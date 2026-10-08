import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateInsuranceInput,
  IInsuranceRepository,
  InsuranceRecord,
  InsuranceStatus,
} from './insurance.repository.interface';

type InsuranceRow = {
  id: string;
  farmId: string;
  partner: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const SELECT = {
  id: true,
  farmId: true,
  partner: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toRecord(row: InsuranceRow): InsuranceRecord {
  return {
    id: row.id,
    farmId: row.farmId,
    partner: row.partner,
    status: row.status as InsuranceStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Persisted rather than held in a Map.
 *
 * docs/DATABASE.md §6 specifies farm 1:N insurance, so farm_id is indexed rather
 * than unique and the read returns the most recent policy. The previous Map was
 * keyed by farm, which quietly capped a farm at one policy for its lifetime.
 */
@Injectable()
export class InsuranceRepository implements IInsuranceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByFarmId(farmId: string): Promise<InsuranceRecord | null> {
    const row = await this.prisma.insurance.findFirst({
      where: { farmId },
      orderBy: { createdAt: 'desc' },
      select: SELECT,
    });
    return row ? toRecord(row) : null;
  }

  async create(input: CreateInsuranceInput): Promise<InsuranceRecord> {
    const row = await this.prisma.insurance.create({
      data: {
        farmId: input.farmId,
        partner: input.partner,
        status: input.status,
      },
      select: SELECT,
    });
    return toRecord(row);
  }
}
