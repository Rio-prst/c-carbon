import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateEvidenceAssetInput,
  CreateEvidenceInput,
  EvidenceAssetRecord,
  EvidenceRecord,
  IEvidenceRepository,
} from './farm-data.repository.interface';

/**
 * In-memory for MVP. The asset rows are metadata only; the bytes live in object
 * storage, so a restart loses which file belonged to which submission but not
 * the file itself. Persisting both together is open work.
 */
@Injectable()
export class EvidenceRepository implements IEvidenceRepository {
  private evidenceMap: Map<string, EvidenceRecord> = new Map();
  private assetMap: Map<string, EvidenceAssetRecord[]> = new Map();

  create(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    const evidence: EvidenceRecord = {
      id: randomUUID(),
      farmDataId: input.farmDataId,
      type: input.type,
      url: input.url,
      fileName: input.fileName,
      uploadedAt: new Date(),
    };
    this.evidenceMap.set(evidence.id, evidence);
    return Promise.resolve(evidence);
  }

  findByFarmDataId(farmDataId: string): Promise<EvidenceRecord[]> {
    return Promise.resolve(
      Array.from(this.evidenceMap.values()).filter(
        (e) => e.farmDataId === farmDataId,
      ),
    );
  }

  createAsset(input: CreateEvidenceAssetInput): Promise<EvidenceAssetRecord> {
    const asset: EvidenceAssetRecord = {
      id: randomUUID(),
      evidenceId: input.evidenceId,
      storageKey: input.storageKey,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      createdAt: new Date(),
    };
    const existing = this.assetMap.get(input.evidenceId) ?? [];
    existing.push(asset);
    this.assetMap.set(input.evidenceId, existing);
    return Promise.resolve(asset);
  }

  findAssetsByEvidenceId(evidenceId: string): Promise<EvidenceAssetRecord[]> {
    return Promise.resolve(this.assetMap.get(evidenceId) ?? []);
  }
}
