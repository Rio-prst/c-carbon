import { Injectable } from '@nestjs/common';
import type { IEvidenceRepository } from './farm-data.repository.interface';
import { CreateEvidenceInput, EvidenceRecord } from './farm-data.repository.interface';

@Injectable()
export class EvidenceRepository implements IEvidenceRepository {
  private evidenceMap: Map<string, EvidenceRecord> = new Map();

  async create(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    const uploadedAt = input.url ? new Date() : new Date();
    const evidence: EvidenceRecord = {
      id: crypto.randomUUID(),
      farmDataId: input.farmDataId,
      type: input.type,
      url: input.url,
      fileName: input.fileName,
      uploadedAt,
    };
    this.evidenceMap.set(evidence.id, evidence);
    return evidence;
  }

  async findByFarmDataId(farmDataId: string): Promise<EvidenceRecord[]> {
    return Array.from(this.evidenceMap.values()).filter(e => e.farmDataId === farmDataId);
  }
}
