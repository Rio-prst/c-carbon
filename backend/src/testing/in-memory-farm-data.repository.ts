import { randomUUID } from 'node:crypto';
import type {
  CreateEvidenceAssetInput,
  CreateEvidenceInput,
  CreateFarmDataInput,
  CreateFarmSeasonInput,
  EvidenceAssetRecord,
  EvidenceRecord,
  FarmDataRecord,
  FarmDataStatus,
  FarmSeasonRecord,
  IEvidenceRepository,
  IFarmDataRepository,
  IFarmSeasonRepository,
} from '../farm-data/farm-data.repository.interface';

/**
 * In-memory doubles for the farm-data repositories.
 *
 * Those repositories are Prisma-backed, and unit tests here exercise services
 * rather than persistence. Booting Prisma for a service test would need a live
 * database, so these stand in for them and keep the service tests hermetic.
 *
 * The behaviour mirrors what the Prisma implementations do, including the parts
 * that are easy to get wrong: submittedAt set on create, status defaulting to
 * SELF_REPORTED, and rejectionReason cleared unless the status is REJECTED.
 *
 * Persistence itself is verified against the real database in
 * `test/integration`, not here.
 */

export class InMemoryFarmDataRepository implements IFarmDataRepository {
  readonly rows: FarmDataRecord[] = [];

  create(input: CreateFarmDataInput): Promise<FarmDataRecord> {
    const now = new Date();
    const record: FarmDataRecord = {
      id: randomUUID(),
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
      status: 'SELF_REPORTED',
      submittedAt: now,
      createdAt: now,
    };
    this.rows.push(record);
    return Promise.resolve(record);
  }

  findByFarmSeasonId(farmSeasonId: string): Promise<FarmDataRecord[]> {
    return Promise.resolve(
      this.rows.filter((row) => row.farmSeasonId === farmSeasonId),
    );
  }

  findByFarmId(farmId: string): Promise<FarmDataRecord[]> {
    return Promise.resolve(this.rows.filter((row) => row.farmId === farmId));
  }

  findAll(): Promise<FarmDataRecord[]> {
    return Promise.resolve([...this.rows]);
  }

  findById(id: string): Promise<FarmDataRecord | null> {
    return Promise.resolve(this.rows.find((row) => row.id === id) ?? null);
  }

  updateStatus(
    id: string,
    status: FarmDataStatus,
    rejectionReason?: string,
  ): Promise<FarmDataRecord> {
    const index = this.rows.findIndex((row) => row.id === id);
    if (index === -1) {
      return Promise.reject(new Error(`Farm data ${id} not found`));
    }
    const updated: FarmDataRecord = {
      ...this.rows[index],
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : undefined,
    };
    this.rows[index] = updated;
    return Promise.resolve(updated);
  }
}

export class InMemoryFarmSeasonRepository implements IFarmSeasonRepository {
  readonly rows: FarmSeasonRecord[] = [];

  create(input: CreateFarmSeasonInput): Promise<FarmSeasonRecord> {
    const record: FarmSeasonRecord = {
      id: randomUUID(),
      farmId: input.farmId,
      seasonLabel: input.seasonLabel,
      startDate: input.startDate,
      endDate: input.endDate,
      sequenceNumber: input.sequenceNumber,
      createdAt: new Date(),
    };
    this.rows.push(record);
    return Promise.resolve(record);
  }

  findByFarmId(farmId: string): Promise<FarmSeasonRecord[]> {
    return Promise.resolve(this.rows.filter((row) => row.farmId === farmId));
  }

  findById(id: string): Promise<FarmSeasonRecord | null> {
    return Promise.resolve(this.rows.find((row) => row.id === id) ?? null);
  }
}

export class InMemoryEvidenceRepository implements IEvidenceRepository {
  readonly rows: EvidenceRecord[] = [];
  readonly assets: EvidenceAssetRecord[] = [];

  create(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    const record: EvidenceRecord = {
      id: randomUUID(),
      farmDataId: input.farmDataId,
      type: input.type,
      url: input.url,
      fileName: input.fileName,
      uploadedAt: new Date(),
    };
    this.rows.push(record);
    return Promise.resolve(record);
  }

  findByFarmDataId(farmDataId: string): Promise<EvidenceRecord[]> {
    return Promise.resolve(
      this.rows.filter((row) => row.farmDataId === farmDataId),
    );
  }

  createAsset(input: CreateEvidenceAssetInput): Promise<EvidenceAssetRecord> {
    const record: EvidenceAssetRecord = {
      id: randomUUID(),
      createdAt: new Date(),
      ...input,
    };
    this.assets.push(record);
    return Promise.resolve(record);
  }

  findAssetsByEvidenceId(evidenceId: string): Promise<EvidenceAssetRecord[]> {
    return Promise.resolve(
      this.assets.filter((row) => row.evidenceId === evidenceId),
    );
  }
}
