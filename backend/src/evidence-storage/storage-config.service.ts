import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Bucket holding evidence files. Created as private, never public. */
export const EVIDENCE_BUCKET = 'evidence';

/** Files are offered to a reviewer through a link that stops working after this. */
export const SIGNED_URL_TTL_SECONDS = 300;

export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
] as const;

export type SupabaseStorageConfig = {
  url: string;
  serviceRoleKey: string;
  bucket: string;
};

/**
 * Storage configuration.
 *
 * The project URL is derived from DATABASE_URL rather than asked for twice.
 * Both values share the same project reference, so a second copy can only drift
 * out of sync. The key is named SERVICE_ROLE_KEY and bypasses Row Level
 * Security entirely, so it stays server-side and is never returned to a client.
 */
@Injectable()
export class StorageConfigService {
  constructor(private readonly config: ConfigService) {}

  resolve(): SupabaseStorageConfig {
    const databaseUrl = this.config.getOrThrow<string>('DATABASE_URL');
    const ref = /postgres\.([A-Za-z0-9_-]+):/.exec(databaseUrl)?.[1];

    if (!ref) {
      throw new Error(
        'Could not derive the Supabase project reference from DATABASE_URL. Expected a connection string of the form postgres://postgres.<ref>:password@...',
      );
    }

    return {
      url: `https://${ref}.supabase.co`,
      serviceRoleKey: this.config.getOrThrow<string>('SERVICE_ROLE_KEY'),
      bucket: EVIDENCE_BUCKET,
    };
  }
}
