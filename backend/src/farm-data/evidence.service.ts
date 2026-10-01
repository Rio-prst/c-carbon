import { Injectable } from '@nestjs/common';
import type { IEvidenceRepository } from './farm-data.repository.interface';
import { CreateEvidenceInput, EvidenceRecord } from './farm-data.repository.interface';

@Injectable()
export class EvidenceService {
  constructor(private readonly evidenceRepository: IEvidenceRepository) {}

  async uploadEvidence(input: CreateEvidenceInput): Promise<EvidenceRecord> {
    return this.evidenceRepository.create(input);
  }

  async getEvidenceByFarmDataId(farmDataId: string): Promise<EvidenceRecord[]> {
    return this.evidenceRepository.findByFarmDataId(farmDataId);
  }
}
