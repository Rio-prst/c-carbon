import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ConsentRecord,
  CreateConsentInput,
  IConsentRepository,
} from './consent.repository.interface';

function toConsentRecord(row: {
  id: string;
  userId: string;
  purpose: string;
  consentVersion: string;
  grantedAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}): ConsentRecord {
  return {
    id: row.id,
    userId: row.userId,
    purpose: row.purpose,
    consentVersion: row.consentVersion,
    grantedAt: row.grantedAt,
    revokedAt: row.revokedAt ?? undefined,
    createdAt: row.createdAt,
  };
}

@Injectable()
export class ConsentRepository implements IConsentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateConsentInput): Promise<ConsentRecord> {
    const row = await this.prisma.consent.create({
      data: {
        userId: input.userId,
        purpose: input.purpose,
        consentVersion: input.consentVersion,
      },
    });
    return toConsentRecord(row);
  }

  async findByUserId(userId: string): Promise<ConsentRecord[]> {
    const rows = await this.prisma.consent.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
    return rows.map(toConsentRecord);
  }

  async findLatestByUserId(userId: string): Promise<ConsentRecord[]> {
    const rows = await this.prisma.consent.findMany({
      where: { userId },
      orderBy: [{ grantedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(toConsentRecord);
  }

  async findOpenByUserAndPurpose(
    userId: string,
    purpose: string,
  ): Promise<ConsentRecord | null> {
    const row = await this.prisma.consent.findFirst({
      where: { userId, purpose, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
    });
    return row ? toConsentRecord(row) : null;
  }

  async revoke(id: string, revokedAt: Date): Promise<ConsentRecord> {
    const row = await this.prisma.consent.update({
      where: { id },
      data: { revokedAt },
    });
    return toConsentRecord(row);
  }
}
