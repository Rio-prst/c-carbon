import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  EVIDENCE_REPOSITORY,
  type CreateEvidenceInput,
  type EvidenceRecord,
  type IEvidenceRepository,
} from './farm-data.repository.interface';
import {
  EVIDENCE_STORAGE,
  type IEvidenceStorage,
  type StoredEvidenceFile,
} from '../evidence-storage/evidence-storage.provider.interface';
import {
  ALLOWED_EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_BYTES,
  SIGNED_URL_TTL_SECONDS,
} from '../evidence-storage/storage-config.service';
import {
  FARM_DATA_REPOSITORY,
  type IFarmDataRepository,
} from './farm-data.repository.interface';
import { FarmsService } from '../farms/farms.service';
import type { JwtPayload } from '../auth/types/jwt-payload';

export type UploadedFile = {
  originalName: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

export type EvidenceView = {
  id: string;
  farmDataId: string;
  type?: string;
  fileName?: string;
  url?: string;
  uploadedAt: string;
  /** Present only when the bytes are actually stored and readable. */
  downloadUrl?: string;
  sizeBytes?: number;
  contentType?: string;
};

export type UploadEvidenceOutcome =
  | { ok: true; evidence: EvidenceView }
  | {
      ok: false;
      reason: 'too_large' | 'unsupported_type' | 'storage_unavailable';
      message: string;
    };

@Injectable()
export class EvidenceService {
  constructor(
    @Inject(EVIDENCE_REPOSITORY)
    private readonly evidenceRepository: IEvidenceRepository,
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    @Inject(EVIDENCE_STORAGE)
    private readonly storage: IEvidenceStorage,
    private readonly farmsService: FarmsService,
  ) {}

  async uploadEvidence(
    user: JwtPayload,
    farmId: string,
    input: CreateEvidenceInput,
  ): Promise<EvidenceRecord> {
    await this.farmsService.resolveAccess(user, farmId);
    await this.assertFarmDataOwnership(farmId, input.farmDataId);
    return this.evidenceRepository.create(input);
  }

  async getEvidenceByFarmDataId(
    user: JwtPayload,
    farmId: string,
    farmDataId: string,
  ): Promise<EvidenceView[]> {
    await this.farmsService.resolveAccess(user, farmId);
    await this.assertFarmDataOwnership(farmId, farmDataId);
    const records = await this.evidenceRepository.findByFarmDataId(farmDataId);

    return Promise.all(records.map((record) => this.toView(record)));
  }

  private async toView(record: EvidenceRecord): Promise<EvidenceView> {
    const view: EvidenceView = {
      id: record.id,
      farmDataId: record.farmDataId,
      type: record.type,
      fileName: record.fileName,
      url: record.url,
      uploadedAt: record.uploadedAt.toISOString(),
    };

    const assets = await this.evidenceRepository.findAssetsByEvidenceId(
      record.id,
    );
    const asset = assets[0];

    // A link is issued per read and expires, so a reviewer cannot hand it on and
    // have it keep working. A storage failure leaves the listing usable rather
    // than failing the whole request.
    if (asset != null) {
      const signed = await this.storage.createSignedUrl(
        asset.storageKey,
        SIGNED_URL_TTL_SECONDS,
      );
      if (signed != null) {
        view.downloadUrl = signed;
        view.sizeBytes = asset.sizeBytes;
        view.contentType = asset.contentType;
      }
    }

    return view;
  }

  /**
   * Stores the bytes behind an evidence record.
   *
   * Returns a discriminated outcome rather than throwing, because
   * docs/BUSINESS-RULES.md §13 treats a storage problem as a friendly error the
   * farmer can retry. The caller keeps the submission either way: a farmer must
   * not lose recorded production data because a file upload failed.
   */
  async uploadEvidenceFile(
    user: JwtPayload,
    farmId: string,
    farmDataId: string,
    file: UploadedFile,
  ): Promise<UploadEvidenceOutcome> {
    await this.farmsService.resolveAccess(user, farmId);
    await this.assertFarmDataOwnership(farmId, farmDataId);

    if (file.size > MAX_EVIDENCE_BYTES) {
      return {
        ok: false,
        reason: 'too_large',
        message: `File is larger than the ${Math.round(MAX_EVIDENCE_BYTES / 1024 / 1024)} MB limit`,
      };
    }
    if (
      !(ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(
        file.mimetype,
      )
    ) {
      return {
        ok: false,
        reason: 'unsupported_type',
        message: `File type ${file.mimetype} is not accepted`,
      };
    }

    // Keyed by farm and submission so a file can never be guessed across farms.
    const storageKey = `farm-${farmId}/data-${farmDataId}/${randomUUID()}`;

    let stored: StoredEvidenceFile;
    try {
      stored = await this.storage.upload(
        storageKey,
        file.buffer,
        file.mimetype,
      );
    } catch (error: unknown) {
      // Nothing reached the bucket, so there is nothing to clean up.
      return {
        ok: false,
        reason: 'storage_unavailable',
        message:
          error instanceof Error
            ? error.message
            : 'Evidence storage is unavailable',
      };
    }

    try {
      const record = await this.evidenceRepository.create({
        farmDataId,
        type: file.mimetype.startsWith('image/') ? 'FIELD_PHOTO' : 'OTHER',
        fileName: file.originalName,
      });
      await this.evidenceRepository.createAsset({
        evidenceId: record.id,
        storageKey: stored.storageKey,
        contentType: stored.contentType,
        sizeBytes: stored.sizeBytes,
      });

      return { ok: true, evidence: await this.toView(record) };
    } catch (error: unknown) {
      // The object is stored but nothing points at it, so it would be
      // unreachable and orphaned. Removed rather than left in the bucket.
      await this.storage.remove(storageKey).catch(() => undefined);
      return {
        ok: false,
        reason: 'storage_unavailable',
        message:
          error instanceof Error
            ? error.message
            : 'Evidence could not be recorded',
      };
    }
  }

  private async assertFarmDataOwnership(
    farmId: string,
    farmDataId: string,
  ): Promise<void> {
    const data = await this.farmDataRepository.findById(farmDataId);
    if (!data || data.farmId !== farmId) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'FARM_DATA_NOT_FOUND',
        message: 'Farm data not found',
        details: {},
      });
    }
  }
}
