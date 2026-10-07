import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CorporateRecord,
  CreateCorporateInput,
  ICorporateRepository,
} from './corporate.repository.interface';

const corporateSelect = {
  id: true,
  userId: true,
  companyName: true,
  industry: true,
  region: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

type CorporateRow = {
  id: string;
  userId: string;
  companyName: string;
  industry: string;
  region: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

function toCorporateRecord(row: CorporateRow): CorporateRecord {
  return { ...row };
}

@Injectable()
export class CorporateRepository implements ICorporateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCorporateInput): Promise<CorporateRecord> {
    const row = await this.prisma.corporate.create({
      data: input,
      select: corporateSelect,
    });
    return toCorporateRecord(row);
  }

  async findByUserId(userId: string): Promise<CorporateRecord | null> {
    const row = await this.prisma.corporate.findUnique({
      where: { userId },
      select: corporateSelect,
    });
    return row ? toCorporateRecord(row) : null;
  }

  async findById(id: string): Promise<CorporateRecord | null> {
    const row = await this.prisma.corporate.findUnique({
      where: { id },
      select: corporateSelect,
    });
    return row ? toCorporateRecord(row) : null;
  }
}
