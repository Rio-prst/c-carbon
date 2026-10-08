import { describe, expect, it, beforeEach } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { ConsentService } from './consent.service';
import {
  CARBON_PROJECT_PURPOSE,
  CONSENT_VERSION,
  type ConsentRecord,
  type CreateConsentInput,
  type IConsentRepository,
} from './consent.repository.interface';

const USER = 'farmer-1';

/** In-memory stand-in matching the append-only semantics of the real table. */
class FakeConsentRepository implements IConsentRepository {
  rows: ConsentRecord[] = [];
  private counter = 0;

  create(input: CreateConsentInput): Promise<ConsentRecord> {
    this.counter += 1;
    const now = new Date('2026-01-01T00:00:00Z');
    const row: ConsentRecord = {
      id: `consent-${this.counter}`,
      userId: input.userId,
      purpose: input.purpose,
      consentVersion: input.consentVersion,
      grantedAt: now,
      createdAt: now,
    };
    this.rows.push(row);
    return Promise.resolve(row);
  }

  findByUserId(userId: string): Promise<ConsentRecord[]> {
    return Promise.resolve(this.rows.filter((r) => r.userId === userId));
  }

  findLatestByUserId(userId: string): Promise<ConsentRecord[]> {
    return Promise.resolve(
      this.rows
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.grantedAt.getTime() - a.grantedAt.getTime()),
    );
  }

  findOpenByUserAndPurpose(
    userId: string,
    purpose: string,
  ): Promise<ConsentRecord | null> {
    return Promise.resolve(
      this.rows.find(
        (r) => r.userId === userId && r.purpose === purpose && !r.revokedAt,
      ) ?? null,
    );
  }

  revoke(id: string, revokedAt: Date): Promise<ConsentRecord> {
    const index = this.rows.findIndex((r) => r.id === id);
    const updated = { ...this.rows[index], revokedAt };
    this.rows[index] = updated;
    return Promise.resolve(updated);
  }
}

describe('ConsentService', () => {
  let service: ConsentService;
  let repository: FakeConsentRepository;

  beforeEach(() => {
    repository = new FakeConsentRepository();
    service = new ConsentService(repository);
  });

  it('reports no consent before any grant', async () => {
    const status = await service.getConsents(USER);

    expect(status.consents).toEqual([]);
    expect(status.carbon_project_granted).toBe(false);
  });

  it('grants the carbon project purpose at the configured version', async () => {
    const status = await service.grant(USER, CARBON_PROJECT_PURPOSE);

    expect(status.carbon_project_granted).toBe(true);
    expect(status.active_purposes).toEqual([CARBON_PROJECT_PURPOSE]);
    expect(status.consents[0].consent_version).toBe(CONSENT_VERSION);
  });

  it('treats a fresh grant as active', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);

    expect(await service.hasActiveCarbonProjectConsent(USER)).toBe(true);
  });

  it('revoking removes it from the active purposes', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);

    const status = await service.revoke(USER, CARBON_PROJECT_PURPOSE);

    expect(status.carbon_project_granted).toBe(false);
    expect(await service.hasActiveCarbonProjectConsent(USER)).toBe(false);
  });

  /**
   * A withdrawal has to stay on record. Deleting the row would erase the fact
   * that the farmer ever consented, and with it the audit of the revocation.
   */
  it('keeps the revoked grant visible instead of deleting it', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);
    await service.revoke(USER, CARBON_PROJECT_PURPOSE);

    const status = await service.getConsents(USER);

    expect(status.consents).toHaveLength(1);
    expect(status.consents[0].active).toBe(false);
    expect(status.consents[0].revoked_at).not.toBeNull();
  });

  it('rejects revoking a purpose that was never granted', async () => {
    await expect(service.revoke(USER, CARBON_PROJECT_PURPOSE)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects revoking twice', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);
    await service.revoke(USER, CARBON_PROJECT_PURPOSE);

    await expect(service.revoke(USER, CARBON_PROJECT_PURPOSE)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('can be re-granted after a revocation', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);
    await service.revoke(USER, CARBON_PROJECT_PURPOSE);

    const status = await service.grant(USER, CARBON_PROJECT_PURPOSE);

    expect(status.carbon_project_granted).toBe(true);
    // Both the withdrawal and the new grant remain on record.
    expect(status.consents).toHaveLength(2);
  });

  it('revocation of one purpose leaves the others alone', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);
    await service.grant(USER, 'scoring');

    await service.revoke(USER, CARBON_PROJECT_PURPOSE);
    const status = await service.getConsents(USER);

    expect(status.active_purposes).toEqual(['scoring']);
    expect(await service.hasActiveCarbonProjectConsent(USER)).toBe(false);
  });

  it('states that withdrawal affects the next aggregation', async () => {
    const status = await service.getConsents(USER);

    expect(status.notice).toContain('agr');
  });

  it('only counts a farmer own consents', async () => {
    await service.grant(USER, CARBON_PROJECT_PURPOSE);

    expect(await service.hasActiveCarbonProjectConsent('other-farmer')).toBe(
      false,
    );
  });
});
