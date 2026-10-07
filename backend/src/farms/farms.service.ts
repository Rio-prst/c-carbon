import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  FARMS_REPOSITORY,
  type CreateFarmInput,
  type FarmRecord,
  type IFarmsRepository,
} from './farms.repository.interface';
import { CreateFarmDto } from './dto/create-farm.dto';
import type { JwtPayload } from '../auth/types/jwt-payload';

const DFID_PREFIX = 'CF';
/** Maximum attempts to generate a unique Digital Farm ID before giving up. */
const DFID_MAX_ATTEMPTS = 3;

@Injectable()
export class FarmsService {
  constructor(
    @Inject(FARMS_REPOSITORY)
    private readonly farmsRepository: IFarmsRepository,
  ) {}

  /**
   * Transforms internal FarmRecord to API response format.
   * Ensures dates are ISO strings and fields match mobile contract.
   */
  private serializeFarm(farm: FarmRecord) {
    return {
      id: farm.id,
      userId: farm.userId,
      digitalFarmId: farm.digitalFarmId,
      name: farm.name,
      lat: farm.lat,
      lng: farm.lng,
      landAreaHa: farm.landAreaHa,
      commodity: farm.commodity,
      status: farm.status,
      createdAt: farm.createdAt.toISOString(),
      updatedAt: farm.updatedAt.toISOString(),
    };
  }

  /** Creates a farm owned by `userId` with a backend-generated, unique DFID. */
  async createFarm(
    userId: string,
    dto: CreateFarmDto,
  ): Promise<ReturnType<FarmsService['serializeFarm']>> {
    for (let attempt = 0; attempt < DFID_MAX_ATTEMPTS; attempt++) {
      const digitalFarmId = this.generateDigitalFarmId();

      try {
        const farm = await this.farmsRepository.create({
          userId,
          digitalFarmId,
          name: dto.name,
          lat: dto.lat,
          lng: dto.lng,
          landAreaHa: dto.landAreaHa,
          commodity: dto.commodity,
          status: 'REGISTERED',
        } satisfies CreateFarmInput);
        return this.serializeFarm(farm);
      } catch (error) {
        if (!this.isUniqueViolation(error)) {
          throw error;
        }
      }
    }

    throw new ConflictException({
      statusCode: 409,
      code: 'DIGITAL_FARM_ID_COLLISION',
      message: 'Could not generate a unique Digital Farm ID, please try again',
      details: {},
    });
  }

  async listFarms(
    userId: string,
  ): Promise<ReturnType<FarmsService['serializeFarm']>[]> {
    const farms = await this.farmsRepository.findByUserId(userId);
    return farms.map((farm) => this.serializeFarm(farm));
  }

  async getFarm(
    userId: string,
    farmId: string,
  ): Promise<ReturnType<FarmsService['serializeFarm']>> {
    const farm = await this.assertOwnership(userId, farmId);
    return this.serializeFarm(farm);
  }

  /**
   * Ensures the farm exists and belongs to `userId`.
   * Missing and non-owned farms both return 404 so ownership cannot be probed.
   */
  async assertOwnership(userId: string, farmId: string): Promise<FarmRecord> {
    const farm = await this.farmsRepository.findById(farmId);

    if (!farm || farm.userId !== userId) {
      throw this.farmNotFound();
    }

    return farm;
  }

  /**
   * Resolves a farm for a request the role guard has already authorised.
   *
   * Admin has to reach other farmers' farms for data review and carbon
   * eligibility, but `assertOwnership` deliberately rejects everyone but the
   * owner. Deciding the bypass here keeps it from being re-derived at each call
   * site, and keeps the ownership check for farmers so a farm id still cannot be
   * probed to discover whether it exists.
   */
  async resolveAccess(user: JwtPayload, farmId: string): Promise<FarmRecord> {
    if (user.role === 'ADMIN') {
      const farm = await this.findByIdForAdmin(farmId);
      if (!farm) {
        throw this.farmNotFound();
      }
      return farm;
    }

    return this.assertOwnership(user.sub, farmId);
  }

  private farmNotFound(): NotFoundException {
    return new NotFoundException({
      statusCode: 404,
      code: 'FARM_NOT_FOUND',
      message: 'Farm not found',
      details: {},
    });
  }

  /**
   * Resolves a farm for admin review, without an ownership check.
   *
   * This deliberately bypasses `assertOwnership`, so it must only be reachable
   * from an ADMIN-guarded controller. Kept here rather than exposing the
   * repository so modules never reach into persistence directly.
   */
  async findByIdForAdmin(farmId: string): Promise<FarmRecord | null> {
    return this.farmsRepository.findById(farmId);
  }

  private generateDigitalFarmId(): string {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 5).toUpperCase();
    return `${DFID_PREFIX}-${suffix}`;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'P2002'
    );
  }
}
