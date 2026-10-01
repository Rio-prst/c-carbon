import type { FarmStatus } from '../generated/prisma/client.js';

export const FARMS_REPOSITORY = Symbol('FARMS_REPOSITORY');

export type CreateFarmInput = {
  userId: string;
  digitalFarmId: string;
  name: string;
  lat: number;
  lng: number;
  landAreaHa: number;
  commodity: string;
  status: FarmStatus;
};

export type FarmRecord = {
  id: string;
  userId: string;
  digitalFarmId: string;
  name: string;
  lat: number;
  lng: number;
  landAreaHa: number;
  commodity: string;
  status: FarmStatus;
  createdAt: Date;
  updatedAt: Date;
};

export interface IFarmsRepository {
  create(input: CreateFarmInput): Promise<FarmRecord>;

  findByDigitalFarmId(digitalFarmId: string): Promise<FarmRecord | null>;

  findByUserId(userId: string): Promise<FarmRecord[]>;

  findById(id: string): Promise<FarmRecord | null>;
}
