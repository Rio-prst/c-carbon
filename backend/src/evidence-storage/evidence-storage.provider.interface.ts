export const EVIDENCE_STORAGE = Symbol('EVIDENCE_STORAGE');

export type StoredEvidenceFile = {
  /** Opaque key inside the bucket. Never a public URL. */
  storageKey: string;
  contentType: string;
  sizeBytes: number;
};

/**
 * Storage for evidence files.
 *
 * Kept behind an interface so the driver can change without touching the
 * service or the client contract. Nothing here returns a permanent URL: a file
 * is only reachable through a short-lived link issued after an ownership check,
 * because evidence is personal farmer data and docs/BUSINESS-RULES.md §10
 * forbids exposing individual identity.
 */
export interface IEvidenceStorage {
  upload(
    storageKey: string,
    file: Buffer,
    contentType: string,
  ): Promise<StoredEvidenceFile>;

  /** Resolves to null when the object is gone, rather than throwing. */
  createSignedUrl(
    storageKey: string,
    ttlSeconds: number,
  ): Promise<string | null>;

  remove(storageKey: string): Promise<void>;

  /** Reports whether the bucket is reachable, for startup diagnostics. */
  isReachable(): Promise<boolean>;
}
