import { Injectable, Logger } from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  ALLOWED_EVIDENCE_MIME_TYPES,
  MAX_EVIDENCE_BYTES,
  StorageConfigService,
} from './storage-config.service';
import type {
  IEvidenceStorage,
  StoredEvidenceFile,
} from './evidence-storage.provider.interface';

@Injectable()
export class SupabaseStorageProvider implements IEvidenceStorage {
  private readonly logger = new Logger(SupabaseStorageProvider.name);
  private client: SupabaseClient | null = null;
  private bucket: string = 'evidence';

  constructor(private readonly config: StorageConfigService) {}

  private getClient(): SupabaseClient {
    if (!this.client) {
      const { url, serviceRoleKey, bucket } = this.config.resolve();
      this.client = createClient(url, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.bucket = bucket;
    }
    return this.client;
  }

  async isReachable(): Promise<boolean> {
    try {
      const { error } = await this.getClient().storage.listBuckets();
      return !error;
    } catch {
      return false;
    }
  }

  async upload(
    storageKey: string,
    file: Buffer,
    contentType: string,
  ): Promise<StoredEvidenceFile> {
    if (file.byteLength > MAX_EVIDENCE_BYTES) {
      throw new Error(
        `File is ${file.byteLength} bytes, over the ${MAX_EVIDENCE_BYTES} byte limit`,
      );
    }
    if (
      !(ALLOWED_EVIDENCE_MIME_TYPES as readonly string[]).includes(contentType)
    ) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    const { error } = await this.getClient()
      .storage.from(this.bucket)
      .upload(storageKey, file, {
        contentType,
        // A collision on a random key means something is already stored under
        // it, so overwriting would be wrong rather than convenient.
        upsert: false,
      });

    if (error) {
      this.logger.warn(
        `Evidence upload failed for ${storageKey}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    return {
      storageKey,
      contentType,
      sizeBytes: file.byteLength,
    };
  }

  async createSignedUrl(
    storageKey: string,
    ttlSeconds: number,
  ): Promise<string | null> {
    const { data, error } = await this.getClient()
      .storage.from(this.bucket)
      .createSignedUrl(storageKey, ttlSeconds);

    if (error) {
      this.logger.warn(
        `Signed URL could not be issued for ${storageKey}: ${error.message}`,
      );
      return null;
    }
    return data?.signedUrl ?? null;
  }

  async remove(storageKey: string): Promise<void> {
    const { error } = await this.getClient()
      .storage.from(this.bucket)
      .remove([storageKey]);
    if (error) {
      // Cleanup is best effort: a missing object must not fail the request that
      // triggered it.
      this.logger.warn(
        `Evidence cleanup failed for ${storageKey}: ${error.message}`,
      );
    }
  }
}
