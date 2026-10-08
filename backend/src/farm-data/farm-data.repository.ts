import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateFarmDataInput,
  FarmDataRecord,
  FarmDataStatus,
  IFarmDataRepository,
} from './farm-data.repository.interface';

const dataSelect = {
  id: true,
  farmId: true,
  farmSeasonId: true,
  yieldKg: true,
  waterUsage: true,
  fertilizerUsage: true,
  pesticideUsage: true,
  wasteManagementPractice: true,
  soilPractice: true,
  energyUsage: true,
  lowCarbonPractice: true,
  status: true,
  rejectionReason: true,
  submittedAt: true,
  createdAt: true,
} as const;

/** Prisma returns Decimals; the rest of the code works with numbers. */
type DecimalLike = { toString(): string } | null;

function num(value: DecimalLike): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : undefined;
}

type DataRow = {
  id: string;
  farmId: string;
  farmSeasonId: string;
  yieldKg: DecimalLike;
  waterUsage: DecimalLike;
  fertilizerUsage: DecimalLike;
  pesticideUsage: DecimalLike;
  wasteManagementPractice: string | null;
  soilPractice: string | null;
  energyUsage: DecimalLike;
  lowCarbonPractice: boolean;
  status: FarmDataStatus;
  rejectionReason: string | null;
  submittedAt: Date | null;
  createdAt: Date;
};

function toDataRecord(row: DataRow): FarmDataRecord {
  return {
    id: row.id,
    farmId: row.farmId,
    farmSeasonId: row.farmSeasonId,
    yieldKg: num(row.yieldKg),
    waterUsage: num(row.waterUsage),
    fertilizerUsage: num(row.fertilizerUsage),
    pesticideUsage: num(row.pesticideUsage),
    wasteManagementPractice: row.wasteManagementPractice ?? undefined,
    soilPractice: row.soilPractice ?? undefined,
    energyUsage: num(row.energyUsage),
    lowCarbonPractice: row.lowCarbonPractice,
    status: row.status,
    rejectionReason: row.rejectionReason ?? undefined,
    // Nullable in the schema, but a row written by this repository always sets
    // it, so a null here means the row predates that.
    submittedAt: row.submittedAt ?? row.createdAt,
    createdAt: row.createdAt,
  };
}

/**
 * Persisted rather than held in a Map.
 *
 * docs/BUSINESS-RULES.md §3 requires that a verification or rejection is
 * persisted. While this was in memory, every admin decision was lost on
 * restart and the submission silently reverted to SELF_REPORTED. Persisting it
 * also lets evidence reference a submission through a real foreign key, which
 * is what makes a stored file reachable after a restart.
 */
@Injectable()
export class FarmDataRepository implements IFarmDataRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateFarmDataInput): Promise<FarmDataRecord> {
    const now = new Date();
    const row = await this.prisma.farmData.create({
      data: {
        farmId: input.farmId,
        farmSeasonId: input.farmSeasonId,
        yieldKg: input.yieldKg,
        waterUsage: input.waterUsage,
        fertilizerUsage: input.fertilizerUsage,
        pesticideUsage: input.pesticideUsage,
        wasteManagementPractice: input.wasteManagementPractice,
        soilPractice: input.soilPractice,
        energyUsage: input.energyUsage,
        lowCarbonPractice: input.lowCarbonPractice ?? false,
        // Set explicitly: the column is nullable with no default, so leaving it
        // out would leave the UI without a submitted date.
        submittedAt: now,
      },
      select: dataSelect,
    });
    return toDataRecord(row);
  }

  async findByFarmSeasonId(farmSeasonId: string): Promise<FarmDataRecord[]> {
    const rows = await this.prisma.farmData.findMany({
      where: { farmSeasonId },
      orderBy: { createdAt: 'asc' },
      select: dataSelect,
    });
    return rows.map(toDataRecord);
  }

  async findByFarmId(farmId: string): Promise<FarmDataRecord[]> {
    const rows = await this.prisma.farmData.findMany({
      where: { farmId },
      orderBy: { createdAt: 'asc' },
      select: dataSelect,
    });
    return rows.map(toDataRecord);
  }

  async findAll(): Promise<FarmDataRecord[]> {
    const rows = await this.prisma.farmData.findMany({
      orderBy: { createdAt: 'asc' },
      select: dataSelect,
    });
    return rows.map(toDataRecord);
  }

  async findById(id: string): Promise<FarmDataRecord | null> {
    const row = await this.prisma.farmData.findUnique({
      where: { id },
      select: dataSelect,
    });
    return row ? toDataRecord(row) : null;
  }

  async updateStatus(
    id: string,
    status: FarmDataStatus,
    rejectionReason?: string,
  ): Promise<FarmDataRecord> {
    const row = await this.prisma.farmData.update({
      where: { id },
      data: {
        status,
        // Cleared unless rejected, matching the previous in-memory behaviour so
        // a re-review does not leave a stale reason behind.
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      select: dataSelect,
    });
    return toDataRecord(row);
  }
}
