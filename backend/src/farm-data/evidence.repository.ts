import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateEvidenceAssetInput,
  CreateEvidenceInput,
  EvidenceAssetRecord,
  EvidenceRecord,
  IEvidenceRepository,
} from './farm-data.repository.interface';

const evidenceSelect = {
  id: true,
  farmDataId: true,
  type: true,
  url: true,
  fileName: true,
  uploadedAt: true,
} as const;

const assetSelect = {
  id: true,
  evidenceId: true,
  storageKey: true,
  contentType: true,
  sizeBytes: true,
  createdAt: true,
} as const;

type EvidenceRow = {
  id: string;
  farmDataId: string;
  type: string | null;
  url: string | null;
  fileName: string | null;
  uploadedAt: Date;
};

type AssetRow = {
  id: string;
  evidenceId: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
  createdAt: Date;
};

function toEvidenceRecord(row: EvidenceRow): EvidenceRecord {
  return {
    id: row.id,
    farmDataId: row.farmDataId,
    type: row.type ?? undefined,
    url: row.url ?? undefined,
    fileName: row.fileName ?? undefined,
    uploadedAt: row.uploadedAt,
  };
}

function toAssetRecord(row: AssetRow): EvidenceAssetRecord {
  return { ...row };
}

/**
 * Evidence rows live in Postgres rather than in a Map.
 *
 * The file bytes are in object storage, so an in-memory repository left the
 * stored file unreachable: after a restart the reviewer still saw a count but
 * every link resolved to nothing. Persisting the row alongside the asset keeps
 * the two together.
 */
@Injectable()
export class EvidenceRepository implements IEvidenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    const row = await this.prisma.evidence.create({
      data: {
        farmDataId: input.farmDataId,
        type: input.type,
        url: input.url,
        fileName: input.fileName,
      },
      select: evidenceSelect,
    });
    return toEvidenceRecord(row);
  }

  async findByFarmDataId(farmDataId: string): Promise<EvidenceRecord[]> {
    const rows = await this.prisma.evidence.findMany({
      where: { farmDataId },
      orderBy: { uploadedAt: 'asc' },
      select: evidenceSelect,
    });
    return rows.map(toEvidenceRecord);
  }

  async createAsset(
    input: CreateEvidenceAssetInput,
  ): Promise<EvidenceAssetRecord> {
    const row = await this.prisma.evidenceAsset.create({
      data: input,
      select: assetSelect,
    });
    return toAssetRecord(row);
  }

  async findAssetsByEvidenceId(
    evidenceId: string,
  ): Promise<EvidenceAssetRecord[]> {
    const rows = await this.prisma.evidenceAsset.findMany({
      where: { evidenceId },
      orderBy: { createdAt: 'asc' },
      select: assetSelect,
    });
    return rows.map(toAssetRecord);
  }
}
