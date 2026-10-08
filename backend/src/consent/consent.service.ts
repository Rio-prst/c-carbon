import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CARBON_PROJECT_PURPOSE,
  CONSENT_REPOSITORY,
  CONSENT_VERSION,
  type ConsentRecord,
  type IConsentRepository,
} from './consent.repository.interface';

export type ConsentView = {
  purpose: string;
  consent_version: string;
  granted_at: string;
  revoked_at: string | null;
  active: boolean;
};

export type ConsentStatusResponse = {
  consents: ConsentView[];
  /** The only purpose enforced in MVP. */
  active_purposes: string[];
  carbon_project_granted: boolean;
  notice: string;
};

const NOTICE =
  'Persetujuan dapat ditarik kapan saja. Menarik persetujuan penggunaan data proyek karbon akan mengeluarkan lahan Anda dari agregasi berikutnya.';

@Injectable()
export class ConsentService {
  constructor(
    @Inject(CONSENT_REPOSITORY)
    private readonly consentRepository: IConsentRepository,
  ) {}

  private serialize(record: ConsentRecord): ConsentView {
    return {
      purpose: record.purpose,
      consent_version: record.consentVersion,
      granted_at: record.grantedAt.toISOString(),
      revoked_at: record.revokedAt?.toISOString() ?? null,
      active: record.revokedAt == null,
    };
  }

  /**
   * Full grant history, newest first, so a revoked grant stays visible rather
   * than disappearing. docs/BUSINESS-RULES.md §11 makes this the farmer's own
   * record to review in Profile.
   */
  async getConsents(userId: string): Promise<ConsentStatusResponse> {
    const records = await this.consentRepository.findLatestByUserId(userId);
    const consents = records.map((record) => this.serialize(record));
    const activePurposes = [
      ...new Set(consents.filter((c) => c.active).map((c) => c.purpose)),
    ];

    return {
      consents,
      active_purposes: activePurposes,
      carbon_project_granted: activePurposes.includes(CARBON_PROJECT_PURPOSE),
      notice: NOTICE,
    };
  }

  /**
   * Revokes the open grant for a purpose by stamping revoked_at rather than
   * deleting the row, so the withdrawal stays on record.
   */
  async revoke(
    userId: string,
    purpose: string,
  ): Promise<ConsentStatusResponse> {
    const open = await this.consentRepository.findOpenByUserAndPurpose(
      userId,
      purpose,
    );

    if (!open) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'CONSENT_NOT_FOUND',
        message: `No active consent for ${purpose}`,
        details: {},
      });
    }

    await this.consentRepository.revoke(open.id, new Date());
    return this.getConsents(userId);
  }

  async grant(userId: string, purpose: string): Promise<ConsentStatusResponse> {
    await this.consentRepository.create({
      userId,
      purpose,
      consentVersion: CONSENT_VERSION,
    });
    return this.getConsents(userId);
  }

  /**
   * The gate aggregation consults. An owner with no open grant for the carbon
   * purpose is not eligible, which is what makes revocation mean something
   * rather than leaving BUSINESS-RULES.md §11 unenforced.
   */
  async hasActiveCarbonProjectConsent(userId: string): Promise<boolean> {
    const open = await this.consentRepository.findOpenByUserAndPurpose(
      userId,
      CARBON_PROJECT_PURPOSE,
    );
    return open != null;
  }
}
