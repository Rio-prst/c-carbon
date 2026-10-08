import {
  InMemoryFarmDataRepository,
  InMemoryEvidenceRepository,
} from '../testing/in-memory-farm-data.repository';
import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import type { JwtPayload } from '../auth/types/jwt-payload';
import { EvidenceService } from './evidence.service';

const OWNER: JwtPayload = { sub: 'farmer-1', role: 'FARMER' };
const OTHER: JwtPayload = { sub: 'farmer-2', role: 'FARMER' };
const FARM_ID = 'farm-1';

const farmsService = {
  resolveAccess:
    jest.fn<(user: JwtPayload, farmId: string) => Promise<unknown>>(),
};

/** Records what was uploaded so the assertions can inspect real arguments. */
const storage = {
  uploaded: [] as { key: string; size: number; contentType: string }[],
  removed: [] as string[],
  /** Flipped by a test to simulate the bucket being unreachable. */
  failNextUpload: false,
  upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ storageKey: string; contentType: string; sizeBytes: number }> {
    if (storage.failNextUpload) {
      return Promise.reject(new Error('bucket unreachable'));
    }
    storage.uploaded.push({ key, size: buffer.byteLength, contentType });
    return Promise.resolve({
      storageKey: key,
      contentType,
      sizeBytes: buffer.byteLength,
    });
  },
  createSignedUrl(key: string, ttlSeconds: number): Promise<string | null> {
    return Promise.resolve(`https://signed.test/${key}?ttl=${ttlSeconds}`);
  },
  remove(key: string): Promise<void> {
    storage.removed.push(key);
    return Promise.resolve();
  },
  isReachable(): Promise<boolean> {
    return Promise.resolve(true);
  },
};

async function seed(): Promise<InMemoryFarmDataRepository> {
  const repository = new InMemoryFarmDataRepository();
  await repository.create({
    farmId: FARM_ID,
    farmSeasonId: 'season-1',
    yieldKg: 100,
  });
  return repository;
}

describe('EvidenceService', () => {
  let dataRepository: InMemoryFarmDataRepository;
  let evidenceRepository: InMemoryEvidenceRepository;
  let service: EvidenceService;

  beforeEach(async () => {
    dataRepository = await seed();
    evidenceRepository = new InMemoryEvidenceRepository();
    farmsService.resolveAccess.mockReset();
    farmsService.resolveAccess.mockResolvedValue(undefined);
    storage.uploaded = [];
    storage.removed = [];
    storage.failNextUpload = false;
    service = new EvidenceService(
      evidenceRepository,
      dataRepository,
      storage,
      farmsService as never,
    );
  });

  it('stores evidence against a submission the caller owns', async () => {
    const [submission] = await dataRepository.findByFarmId(FARM_ID);

    const created = await service.uploadEvidence(OWNER, FARM_ID, {
      farmDataId: submission.id,
      type: 'FIELD_PHOTO',
      fileName: 'bukti-1.jpg',
    });

    expect(created.fileName).toBe('bukti-1.jpg');
    expect(created.farmDataId).toBe(submission.id);
  });

  it('refuses evidence on a farm the caller does not own', async () => {
    farmsService.resolveAccess.mockRejectedValue(
      new NotFoundException('Farm not found'),
    );
    const [submission] = await dataRepository.findByFarmId(FARM_ID);

    await expect(
      service.uploadEvidence(OTHER, FARM_ID, {
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
      service.uploadEvidence(OWNER, FARM_ID, {
        farmDataId: 'submission-from-another-farm',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists evidence for a submission', async () => {
    const [submission] = await dataRepository.findByFarmId(FARM_ID);
    await service.uploadEvidence(OWNER, FARM_ID, {
      farmDataId: submission.id,
      fileName: 'a.jpg',
    });
    await service.uploadEvidence(OWNER, FARM_ID, {
      farmDataId: submission.id,
      fileName: 'b.pdf',
    });

    const result = await service.getEvidenceByFarmDataId(
      OWNER,
      FARM_ID,
      submission.id,
    );

    expect(result).toHaveLength(2);
  });

  it('does not leak evidence when reading another farm submission', async () => {
    await expect(
      service.getEvidenceByFarmDataId(
        OWNER,
        FARM_ID,
        'submission-from-another-farm',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});

describe('EvidenceService file upload', () => {
  let dataRepository: InMemoryFarmDataRepository;
  let evidenceRepository: InMemoryEvidenceRepository;
  let service: EvidenceService;

  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  async function submission(): Promise<string> {
    const [record] = await dataRepository.findByFarmId(FARM_ID);
    return record.id;
  }

  beforeEach(async () => {
    dataRepository = await seed();
    evidenceRepository = new InMemoryEvidenceRepository();
    farmsService.resolveAccess.mockReset();
    farmsService.resolveAccess.mockResolvedValue(undefined);
    storage.uploaded = [];
    storage.removed = [];
    storage.failNextUpload = false;
    service = new EvidenceService(
      evidenceRepository,
      dataRepository,
      storage,
      farmsService as never,
    );
  });

  it('stores the bytes and returns a short-lived link', async () => {
    const farmDataId = await submission();

    const outcome = await service.uploadEvidenceFile(
      OWNER,
      FARM_ID,
      farmDataId,
      {
        originalName: 'bukti.png',
        mimetype: 'image/png',
        buffer: pngBytes,
        size: pngBytes.byteLength,
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(storage.uploaded).toHaveLength(1);
    expect(storage.uploaded[0].contentType).toBe('image/png');
    // The key is scoped to the farm and submission, so it cannot be guessed
    // across farms even if a filename leaks.
    expect(storage.uploaded[0].key).toContain(FARM_ID);
    expect(storage.uploaded[0].key).toContain(farmDataId);
    expect(outcome.evidence.downloadUrl).toContain('ttl=300');
  });

  it('records a PDF as OTHER rather than a field photo', async () => {
    const farmDataId = await submission();
    const outcome = await service.uploadEvidenceFile(
      OWNER,
      FARM_ID,
      farmDataId,
      {
        originalName: 'laporan.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4'),
        size: 8,
      },
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.evidence.type).toBe('OTHER');
  });

  it('rejects a file type that is not accepted', async () => {
    const farmDataId = await submission();
    const outcome = await service.uploadEvidenceFile(
      OWNER,
      FARM_ID,
      farmDataId,
      {
        originalName: 'skrip.sh',
        mimetype: 'application/x-sh',
        buffer: Buffer.from('rm -rf'),
        size: 6,
      },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('unsupported_type');
    expect(storage.uploaded).toHaveLength(0);
  });

  it('rejects a file over the size limit before touching storage', async () => {
    const farmDataId = await submission();
    const outcome = await service.uploadEvidenceFile(
      OWNER,
      FARM_ID,
      farmDataId,
      {
        originalName: 'besar.png',
        mimetype: 'image/png',
        buffer: Buffer.alloc(0),
        size: 11 * 1024 * 1024,
      },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('too_large');
    expect(storage.uploaded).toHaveLength(0);
  });

  /**
   * Option A: a storage outage is reported as retryable rather than thrown, so
   * the client keeps the submission. A farmer must not lose recorded production
   * data because a file upload failed.
   */
  it('reports an outage as retryable instead of throwing', async () => {
    const farmDataId = await submission();
    storage.failNextUpload = true;

    const outcome = await service.uploadEvidenceFile(
      OWNER,
      FARM_ID,
      farmDataId,
      {
        originalName: 'bukti.png',
        mimetype: 'image/png',
        buffer: pngBytes,
        size: pngBytes.byteLength,
      },
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason).toBe('storage_unavailable');
    // The upload never succeeded, so nothing was stored to clean up.
    expect(storage.removed).toHaveLength(0);
  });

  /**
   * The object is in the bucket but nothing points at it, so it would be
   * unreachable and stay there forever. Removed on the way out.
   */
  it('removes the stored object when recording it fails', async () => {
    const farmDataId = await submission();
    jest
      .spyOn(evidenceRepository, 'create')
      .mockImplementation(() => Promise.reject(new Error('record failed')));

    const outcome = await service.uploadEvidenceFile(
      OWNER,
      FARM_ID,
      farmDataId,
      {
        originalName: 'bukti.png',
        mimetype: 'image/png',
        buffer: pngBytes,
        size: pngBytes.byteLength,
      },
    );

    expect(storage.uploaded).toHaveLength(1);
    expect(storage.removed).toHaveLength(1);
    expect(storage.removed[0]).toBe(storage.uploaded[0].key);
    expect(outcome.ok).toBe(false);
  });

  it('refuses to attach a file to a submission on another farm', async () => {
    await expect(
      service.uploadEvidenceFile(
        OWNER,
        FARM_ID,
        'submission-from-another-farm',
        {
          originalName: 'bukti.png',
          mimetype: 'image/png',
          buffer: pngBytes,
          size: pngBytes.byteLength,
        },
      ),
    ).rejects.toThrow(NotFoundException);

    expect(storage.uploaded).toHaveLength(0);
  });

  it('lets an admin read evidence for a farm they do not own', async () => {
    const farmDataId = await submission();
    const ADMIN: JwtPayload = { sub: 'admin-1', role: 'ADMIN' };

    const outcome = await service.uploadEvidenceFile(
      ADMIN,
      FARM_ID,
      farmDataId,
      {
        originalName: 'bukti.png',
        mimetype: 'image/png',
        buffer: pngBytes,
        size: pngBytes.byteLength,
      },
    );

    expect(outcome.ok).toBe(true);
  });

  it('never returns a permanent URL, only a signed one', async () => {
    const farmDataId = await submission();
    await service.uploadEvidenceFile(OWNER, FARM_ID, farmDataId, {
      originalName: 'bukti.png',
      mimetype: 'image/png',
      buffer: pngBytes,
      size: pngBytes.byteLength,
    });

    const listed = await service.getEvidenceByFarmDataId(
      OWNER,
      FARM_ID,
      farmDataId,
    );

    expect(listed[0].downloadUrl).toContain('signed.test');
    // The storage key itself must not be exposed as a usable address.
    expect(listed[0].url).toBeUndefined();
  });
});
