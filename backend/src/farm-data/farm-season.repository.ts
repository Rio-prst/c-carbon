import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateFarmSeasonInput,
  FarmSeasonRecord,
  IFarmSeasonRepository,
} from './farm-data.repository.interface';

const seasonSelect = {
  id: true,
  farmId: true,
  seasonLabel: true,
  startDate: true,
  endDate: true,
  sequenceNumber: true,
  createdAt: true,
} as const;

function toSeasonRecord(row: {
  id: string;
  farmId: string;
  seasonLabel: string | null;
  startDate: Date | null;
  endDate: Date | null;
  sequenceNumber: number | null;
  createdAt: Date;
}): FarmSeasonRecord {
  return {
    id: row.id,
    farmId: row.farmId,
    seasonLabel: row.seasonLabel ?? undefined,
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
    sequenceNumber: row.sequenceNumber ?? undefined,
    createdAt: row.createdAt,
  };
}

/**
 * Persisted rather than held in a Map.
 *
 * Submissions hang off a season through a foreign key, so a season that only
 * existed in memory could not be referenced from a persisted row. Keeping the
 * two in the same store also means a submission survives a restart, which is
 * what docs/BUSINESS-RULES.md §3 asks for when it says a verification must be
 * persisted.
 */
@Injectable()
export class FarmSeasonRepository implements IFarmSeasonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateFarmSeasonInput): Promise<FarmSeasonRecord> {
    const row = await this.prisma.farmSeason.create({
      data: input,
      select: seasonSelect,
    });
    return toSeasonRecord(row);
  }

  async findByFarmId(farmId: string): Promise<FarmSeasonRecord[]> {
    const rows = await this.prisma.farmSeason.findMany({
      where: { farmId },
      orderBy: { createdAt: 'asc' },
      select: seasonSelect,
    });
    return rows.map(toSeasonRecord);
  }

  async findById(id: string): Promise<FarmSeasonRecord | null> {
    const row = await this.prisma.farmSeason.findUnique({
      where: { id },
      select: seasonSelect,
    });
    return row ? toSeasonRecord(row) : null;
  }
}
