import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import {
  EVIDENCE_REPOSITORY,
  FARM_DATA_REPOSITORY,
  FARM_SEASON_REPOSITORY,
  type IEvidenceRepository,
  type IFarmDataRepository,
  type IFarmSeasonRepository,
} from '../farm-data/farm-data.repository.interface';
import { FarmDataStatus } from '../farm-data/farm-data.repository.interface';
import { INSURANCE_REPOSITORY } from '../insurance/insurance.repository';
import type { IInsuranceRepository } from '../insurance/insurance.repository';
import { CORPORATE_REPOSITORY } from '../corporate/corporate.repository.interface';
import type { ICorporateRepository } from '../corporate/corporate.repository.interface';
import {
  CARBON_PROJECT_PURPOSE,
  CONSENT_REPOSITORY,
  CONSENT_VERSION,
  type IConsentRepository,
} from '../consent/consent.repository.interface';
import { FarmsService } from '../farms/farms.service';
import { RewardService } from '../rewards/reward.service';
import { ScoringService } from '../scoring/scoring.service';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
  type PublicUser,
} from '../users/users.repository.interface';

const DEMO_PASSWORD = 'password123';
const BCRYPT_ROUNDS = 10;

/**
 * Deterministic demo fixtures, so a competition demo never depends on
 * hand-typed data or on data that survived from an earlier run.
 *
 * Only users and farms live in Postgres today, so this runs on boot rather
 * than as a `prisma db seed`. That is a stopgap: when farm data, scores,
 * insurance and rewards move to Prisma this should become a real seed
 * script and a fixture set, not startup code.
 */
@Injectable()
export class DemoSeedService implements OnModuleInit {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
    private readonly farmsService: FarmsService,
    @Inject(FARM_SEASON_REPOSITORY)
    private readonly seasonRepository: IFarmSeasonRepository,
    @Inject(FARM_DATA_REPOSITORY)
    private readonly farmDataRepository: IFarmDataRepository,
    @Inject(EVIDENCE_REPOSITORY)
    private readonly evidenceRepository: IEvidenceRepository,
    @Inject(INSURANCE_REPOSITORY)
    private readonly insuranceRepository: IInsuranceRepository,
    private readonly scoringService: ScoringService,
    private readonly rewardService: RewardService,
    @Inject(CORPORATE_REPOSITORY)
    private readonly corporateRepository: ICorporateRepository,
    @Inject(CONSENT_REPOSITORY)
    private readonly consentRepository: IConsentRepository,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('DEMO_SEED') !== 'true') {
      return;
    }

    try {
      await this.seed();
    } catch (error: unknown) {
      // A fixture failure must not take the API down, or the demo has no
      // fallback to a blank but working state.
      this.logger.error(`Demo seed failed: ${describe(error)}`);
    }
  }

  private async seed(): Promise<void> {
    const farmerA = await this.ensureUser(
      'Petani Satu',
      'farmer1@demo.test',
      'FARMER',
    );
    const farmerB = await this.ensureUser(
      'Petani Dua',
      'farmer2@demo.test',
      'FARMER',
    );
    await this.ensureUser('Admin Demo', 'admin@demo.test', 'ADMIN');
    const corporateUser = await this.ensureUser(
      'Korporat Demo',
      'corporate@demo.test',
      'CORPORATE',
    );
    // A corporate role alone has no company identity, so the overview would
    // have nothing to attribute the figures to.
    await this.ensureCorporate(corporateUser.id);

    // Consent gates aggregation: a farm whose owner has no open carbon_project
    // grant is not eligible. Without these rows the whole carbon chain would
    // fail closed and silently, so they are seeded for both demo farmers.
    await this.ensureConsent(farmerA.id);
    await this.ensureConsent(farmerB.id);

    const farmA1 = await this.ensureFarm(farmerA.id, {
      name: 'Lahan Padi Sawah',
      lat: -6.9,
      lng: 107.6,
      landAreaHa: 2.5,
      commodity: 'Padi',
    });
    const farmA2 = await this.ensureFarm(farmerA.id, {
      name: 'Lahan Kopi',
      lat: -6.85,
      lng: 107.65,
      landAreaHa: 1.8,
      commodity: 'Kopi',
    });
    const farmB1 = await this.ensureFarm(farmerB.id, {
      name: 'Lahan Jagung',
      lat: -6.95,
      lng: 107.55,
      landAreaHa: 3.2,
      commodity: 'Jagung',
    });

    // Carbon projects are scoped to rubber per the competition brief, so three
    // rubber farms must pass every eligibility gate for aggregation to succeed
    // in the demo. The farms above stay non-rubber on purpose, so the filter
    // has something to actually reject.
    const rubberFarmA = await this.ensureFarm(farmerA.id, {
      name: 'Kebun Karet Blok A',
      lat: -6.92,
      lng: 107.58,
      landAreaHa: 4.5,
      commodity: 'Karet',
    });
    const rubberFarmB = await this.ensureFarm(farmerB.id, {
      name: 'Kebun Karet Blok B',
      lat: -6.93,
      lng: 107.59,
      landAreaHa: 3.8,
      commodity: 'Karet',
    });
    const rubberFarmC = await this.ensureFarm(farmerA.id, {
      name: 'Kebun Karet Blok C',
      lat: -6.94,
      lng: 107.6,
      landAreaHa: 5.2,
      commodity: 'Karet',
    });

    await this.insuranceRepository.create({
      farmId: farmA1.id,
      partner: 'PT Asuransi Tani',
      status: 'ACTIVE',
    });
    await this.insuranceRepository.create({
      farmId: farmA2.id,
      partner: 'PT Asuransi Tani',
      status: 'PENDING',
    });
    await this.insuranceRepository.create({
      farmId: farmB1.id,
      partner: 'PT Sejahtera Tani',
      status: 'EXPIRED',
    });

    // Farmer A already has a verified season, so the demo shows a populated
    // score and a high readiness instead of empty states everywhere.
    const seasonA = await this.ensureSeason(farmA1.id, '2025/2026-I');
    if (
      (await this.farmDataRepository.findByFarmSeasonId(seasonA.id)).length ===
      0
    ) {
      const data = await this.farmDataRepository.create({
        farmId: farmA1.id,
        farmSeasonId: seasonA.id,
        yieldKg: 4200,
        waterUsage: 900,
        fertilizerUsage: 180,
        pesticideUsage: 12,
        wasteManagementPractice: 'composting',
        soilPractice: 'cover_cropping',
        energyUsage: 220,
        lowCarbonPractice: true,
      });

      await this.evidenceRepository.create({
        farmDataId: data.id,
        type: 'HARVEST_REPORT',
        fileName: 'laporan-panen.pdf',
        url: 'https://example.test/evidence/harvest-report.pdf',
      });
      await this.farmDataRepository.updateStatus(
        data.id,
        'VERIFIED' satisfies FarmDataStatus,
      );
      await this.scoringService.recalculateFromFarmData(farmerA.id, farmA1.id, {
        ...data,
        farmDataStatus: 'VERIFIED',
      });
      await this.rewardService
        .awardEvent(farmerA.id, 'FARM_DATA_SUBMISSION', {
          description: 'Data awal untuk demo',
        })
        .catch((error: unknown) => {
          this.logger.warn(`Reward seed skipped: ${describe(error)}`);
        });
    }

    // Farmer B is left self-reported on purpose: this is the item the admin
    // review screen starts with during the demo.
    const seasonB = await this.ensureSeason(farmB1.id, '2025/2026-II');
    if (
      (await this.farmDataRepository.findByFarmSeasonId(seasonB.id)).length ===
      0
    ) {
      const data = await this.farmDataRepository.create({
        farmId: farmB1.id,
        farmSeasonId: seasonB.id,
        yieldKg: 3100,
        waterUsage: 1400,
        fertilizerUsage: 320,
        pesticideUsage: 40,
        wasteManagementPractice: 'landfill',
        soilPractice: 'conventional',
        energyUsage: 480,
        lowCarbonPractice: false,
      });
      await this.scoringService.recalculateFromFarmData(farmerB.id, farmB1.id, {
        ...data,
        farmDataStatus: data.status,
      });
    }

    // Each rubber farm gets a verified season with every core field filled and
    // eligible practices, so all four gates pass. Aggregation needs three of
    // them, and the count is deliberately exactly the threshold: raising the
    // threshold later makes the demo fail loudly instead of silently.
    for (const [index, rubberFarm] of [
      rubberFarmA,
      rubberFarmB,
      rubberFarmC,
    ].entries()) {
      const ownerId = index === 1 ? farmerB.id : farmerA.id;
      const season = await this.ensureSeason(rubberFarm.id, '2025/2026-III');

      if (
        (await this.farmDataRepository.findByFarmSeasonId(season.id)).length > 0
      ) {
        continue;
      }

      const data = await this.farmDataRepository.create({
        farmId: rubberFarm.id,
        farmSeasonId: season.id,
        yieldKg: 2600,
        waterUsage: 780,
        fertilizerUsage: 140,
        pesticideUsage: 9,
        wasteManagementPractice: 'composting',
        soilPractice: 'cover_cropping',
        energyUsage: 190,
        lowCarbonPractice: true,
      });

      await this.evidenceRepository.create({
        farmDataId: data.id,
        type: 'HARVEST_REPORT',
        fileName: `laporan-karet-${index + 1}.pdf`,
        url: 'https://example.test/evidence/rubber-harvest-report.pdf',
      });
      await this.farmDataRepository.updateStatus(
        data.id,
        'VERIFIED' satisfies FarmDataStatus,
      );
      await this.scoringService.recalculateFromFarmData(
        ownerId,
        rubberFarm.id,
        {
          ...data,
          farmDataStatus: 'VERIFIED',
        },
      );
    }

    this.logger.log(
      'Demo data ready. Login password for all demo users: password123',
    );
  }

  /** Reuses the existing row when the email is already registered. */
  private async ensureUser(
    name: string,
    email: string,
    role: 'FARMER' | 'ADMIN' | 'CORPORATE',
  ): Promise<PublicUser> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing != null) {
      return existing;
    }

    return this.usersRepository.create({
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS),
    });
  }

  /**
   * Grants the carbon project purpose once. Keyed on the open grant, so a
   * farmer who deliberately revoked it keeps that choice across restarts
   * instead of being re-granted on every boot.
   */
  private async ensureConsent(userId: string): Promise<void> {
    const open = await this.consentRepository.findOpenByUserAndPurpose(
      userId,
      CARBON_PROJECT_PURPOSE,
    );
    if (open != null) {
      return;
    }

    await this.consentRepository.create({
      userId,
      purpose: CARBON_PROJECT_PURPOSE,
      consentVersion: CONSENT_VERSION,
    });
  }

  /** Reuses the existing profile, keyed on the 1:1 user relation. */
  private async ensureCorporate(userId: string): Promise<void> {
    const existing = await this.corporateRepository.findByUserId(userId);
    if (existing != null) {
      return;
    }

    await this.corporateRepository.create({
      userId,
      companyName: 'PT Karbon Nusantara',
      industry: 'Industri manufaktur',
      region: 'Jawa Barat',
    });
  }

  /** Matches on name, since createFarm always generates a new DFID. */
  private async ensureFarm(
    userId: string,
    input: {
      name: string;
      lat: number;
      lng: number;
      landAreaHa: number;
      commodity: string;
    },
  ) {
    const owned = await this.farmsService.listFarms(userId);
    const match = owned.find((farm) => farm.name === input.name);
    if (match != null) {
      return match;
    }

    return this.farmsService.createFarm(userId, input);
  }

  private async ensureSeason(farmId: string, label: string) {
    const existing = await this.seasonRepository.findByFarmId(farmId);
    const match = existing.find((season) => season.seasonLabel === label);
    if (match != null) {
      return match;
    }

    return this.seasonRepository.create({
      farmId,
      seasonLabel: label,
      sequenceNumber: existing.length + 1,
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-03-31'),
    });
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
