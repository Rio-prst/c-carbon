import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateFarmInput,
  FarmRecord,
  IFarmsRepository,
} from './farms.repository.interface';
import type { Farm, FarmStatus } from '../generated/prisma/client.js';

const farmSelect = {
  id: true,
  userId: true,
  digitalFarmId: true,
  name: true,
  lat: true,
  lng: true,
  landAreaHa: true,
  commodity: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toFarmRecord(farm: {
  id: string;
  userId: string;
  digitalFarmId: string;
  name: string;
  lat: { toString(): string };
  lng: { toString(): string };
  landAreaHa: { toString(): string };
  commodity: string;
  status: FarmStatus;
  createdAt: Date;
  updatedAt: Date;
}): FarmRecord {
  return {
    ...farm,
    lat: Number(farm.lat.toString()),
    lng: Number(farm.lng.toString()),
    landAreaHa: Number(farm.landAreaHa.toString()),
  };
}

@Injectable()
export class FarmsRepository implements IFarmsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateFarmInput): Promise<FarmRecord> {
    const farm = await this.prisma.farm.create({
      data: {
        userId: input.userId,
        digitalFarmId: input.digitalFarmId,
        name: input.name,
        lat: input.lat,
        lng: input.lng,
        landAreaHa: input.landAreaHa,
        commodity: input.commodity,
        status: input.status,
      },
      select: farmSelect,
    });
    return toFarmRecord(farm);
  }

  async findByDigitalFarmId(digitalFarmId: string): Promise<FarmRecord | null> {
    const farm = await this.prisma.farm.findUnique({
      where: { digitalFarmId },
      select: farmSelect,
    });
    return farm ? toFarmRecord(farm) : null;
  }

  async findByUserId(userId: string): Promise<FarmRecord[]> {
    const farms = await this.prisma.farm.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: farmSelect,
    });
    return farms.map(toFarmRecord);
  }

  async findById(id: string): Promise<FarmRecord | null> {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      select: farmSelect,
    });
    return farm ? toFarmRecord(farm) : null;
  }
}
