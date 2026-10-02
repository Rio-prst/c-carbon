import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateEvidenceInput,
  EvidenceRecord,
  IEvidenceRepository,
} from './farm-data.repository.interface';

@Injectable()
export class EvidenceRepository implements IEvidenceRepository {
  private evidenceMap: Map<string, EvidenceRecord> = new Map();

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
}
