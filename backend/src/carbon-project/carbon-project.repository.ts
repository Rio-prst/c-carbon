import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CarbonProjectRecord,
  CreateCarbonProjectInput,
  ICarbonProjectRepository,
  ProjectStatus,
} from './carbon-project.repository.interface';

const projectSelect = {
  id: true,
  name: true,
  status: true,
  region: true,
  commodityFocus: true,
  totalFarms: true,
  totalAreaHa: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toProjectRecord(project: {
  id: string;
  name: string;
  status: ProjectStatus;
  region: string;
  commodityFocus: string;
  totalFarms: number;
  totalAreaHa: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}): CarbonProjectRecord {
  return {
    ...project,
    totalAreaHa: Number(project.totalAreaHa.toString()),
  };
}

@Injectable()
export class CarbonProjectRepository implements ICarbonProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateCarbonProjectInput): Promise<CarbonProjectRecord> {
    const project = await this.prisma.carbonProject.create({
      data: input,
      select: projectSelect,
    });
    return toProjectRecord(project);
  }

  async findById(id: string): Promise<CarbonProjectRecord | null> {
    const project = await this.prisma.carbonProject.findUnique({
      where: { id },
      select: projectSelect,
    });
    return project ? toProjectRecord(project) : null;
  }

  async findAll(): Promise<CarbonProjectRecord[]> {
    const projects = await this.prisma.carbonProject.findMany({
      orderBy: { createdAt: 'desc' },
      select: projectSelect,
    });
    return projects.map(toProjectRecord);
  }

  async updateStatus(
    id: string,
    status: ProjectStatus,
  ): Promise<CarbonProjectRecord> {
    const project = await this.prisma.carbonProject.update({
      where: { id },
      data: { status },
      select: projectSelect,
    });
    return toProjectRecord(project);
  }

  /**
   * Membership is replaced inside a transaction: aggregation either attaches
   * every eligible farm or none, so a failure part-way cannot leave a project
   * holding an arbitrary subset that a later read would treat as authoritative.
   */
  async setProjectFarms(
    carbonProjectId: string,
    farmIds: string[],
  ): Promise<CarbonProjectRecord> {
    return this.prisma.$transaction(async (tx) => {
      const farms = await tx.farm.findMany({
        where: { id: { in: farmIds } },
        select: { landAreaHa: true },
      });

      const totalAreaHa = farms.reduce(
        (sum, farm) => sum + Number(farm.landAreaHa.toString()),
        0,
      );

      await tx.projectFarm.deleteMany({ where: { carbonProjectId } });
      if (farmIds.length > 0) {
        await tx.projectFarm.createMany({
          data: farmIds.map((farmId) => ({ carbonProjectId, farmId })),
        });
      }

      const project = await tx.carbonProject.update({
        where: { id: carbonProjectId },
        data: {
          totalFarms: farmIds.length,
          totalAreaHa,
          status: 'AGGREGATING',
        },
        select: projectSelect,
      });

      return toProjectRecord(project);
    });
  }

  async findFarmIds(carbonProjectId: string): Promise<string[]> {
    const rows = await this.prisma.projectFarm.findMany({
      where: { carbonProjectId },
      select: { farmId: true },
    });
    return rows.map((row) => row.farmId);
  }

  async findProjectIdsByFarmId(farmId: string): Promise<string[]> {
    const rows = await this.prisma.projectFarm.findMany({
      where: { farmId },
      select: { carbonProjectId: true },
    });
    return rows.map((row) => row.carbonProjectId);
  }
}
