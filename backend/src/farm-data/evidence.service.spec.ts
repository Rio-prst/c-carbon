import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { EvidenceService } from './evidence.service';
import { EvidenceRepository } from './evidence.repository';
import { FarmDataRepository } from './farm-data.repository';

const OWNER_ID = 'farmer-1';
const OTHER_ID = 'farmer-2';
const FARM_ID = 'farm-1';

const farmsService = {
  assertOwnership:
    jest.fn<(userId: string, farmId: string) => Promise<unknown>>(),
};

function seed(): FarmDataRepository {
  const repository = new FarmDataRepository();
  repository.create({
    farmId: FARM_ID,
    farmSeasonId: 'season-1',
    yieldKg: 100,
  });
  return repository;
}

describe('EvidenceService', () => {
  let dataRepository: FarmDataRepository;
  let evidenceRepository: EvidenceRepository;
  let service: EvidenceService;

  beforeEach(() => {
    dataRepository = seed();
    evidenceRepository = new EvidenceRepository();
    farmsService.assertOwnership.mockReset();
    farmsService.assertOwnership.mockResolvedValue(undefined);
    service = new EvidenceService(
      evidenceRepository,
      dataRepository,
      farmsService as never,
    );
  });

  it('stores evidence against a submission the caller owns', async () => {
    const [submission] = await dataRepository.findByFarmId(FARM_ID);

    const created = await service.uploadEvidence(OWNER_ID, FARM_ID, {
      farmDataId: submission.id,
      type: 'FIELD_PHOTO',
      fileName: 'bukti-1.jpg',
    });

    expect(created.fileName).toBe('bukti-1.jpg');
    expect(created.farmDataId).toBe(submission.id);
  });

  it('refuses evidence on a farm the caller does not own', async () => {
    farmsService.assertOwnership.mockRejectedValue(
      new NotFoundException('Farm not found'),
    );
    const [submission] = await dataRepository.findByFarmId(FARM_ID);

    await expect(
      service.uploadEvidence(OTHER_ID, FARM_ID, {
        farmDataId: submission.id,
      }),
    ).rejects.toThrow();
  });

  /**
   * Ownership of the farm is not enough: a submission id from another farm
   * must not be usable even by the owner of the farm in the URL.
   */
  it('refuses evidence that hangs off another farm', async () => {
    await expect(
      service.uploadEvidence(OWNER_ID, FARM_ID, {
        farmDataId: 'submission-from-another-farm',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists evidence for a submission', async () => {
    const [submission] = await dataRepository.findByFarmId(FARM_ID);
    await service.uploadEvidence(OWNER_ID, FARM_ID, {
      farmDataId: submission.id,
      fileName: 'a.jpg',
    });
    await service.uploadEvidence(OWNER_ID, FARM_ID, {
      farmDataId: submission.id,
      fileName: 'b.pdf',
    });

    const result = await service.getEvidenceByFarmDataId(
      OWNER_ID,
      FARM_ID,
      submission.id,
    );

    expect(result).toHaveLength(2);
  });

  it('does not leak evidence when reading another farm submission', async () => {
    await expect(
      service.getEvidenceByFarmDataId(
        OWNER_ID,
        FARM_ID,
        'submission-from-another-farm',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
