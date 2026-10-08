export const CONSENT_REPOSITORY = Symbol('CONSENT_REPOSITORY');

/**
 * The only purpose enforced in MVP. Consent rows can hold other purposes later,
 * but nothing reads them yet, and adding unenforced purposes would imply a
 * control that does not exist.
 */
export const CARBON_PROJECT_PURPOSE = 'carbon_project';

export const CONSENT_VERSION = 'v1';

export type ConsentRecord = {
  id: string;
  userId: string;
  purpose: string;
  consentVersion: string;
  grantedAt: Date;
  revokedAt?: Date;
  createdAt: Date;
};

export type CreateConsentInput = {
  userId: string;
  purpose: string;
  consentVersion: string;
};

export interface IConsentRepository {
  /** Appends a grant. Never overwrites an existing one, to keep the history. */
  create(input: CreateConsentInput): Promise<ConsentRecord>;

  findByUserId(userId: string): Promise<ConsentRecord[]>;

  /** Most recent first, so callers can treat index 0 as the latest. */
  findLatestByUserId(userId: string): Promise<ConsentRecord[]>;

  findOpenByUserAndPurpose(
    userId: string,
    purpose: string,
  ): Promise<ConsentRecord | null>;

  revoke(id: string, revokedAt: Date): Promise<ConsentRecord>;
}
