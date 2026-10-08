import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FarmsModule } from './farms/farms.module';
import { InsuranceModule } from './insurance/insurance.module';
import { ScoringModule } from './scoring/scoring.module';
import { AdminModule } from './admin/admin.module';
import { CRSModule } from './crs/crs.module';
import { RewardModule } from './rewards/reward.module';
import { FarmDataModule } from './farm-data/farm-data.module';
import { DemoSeedModule } from './demo-seed/demo-seed.module';
import { CarbonProjectModule } from './carbon-project/carbon-project.module';
import { CorporateModule } from './corporate/corporate.module';
import { ConsentModule } from './consent/consent.module';
import { EvidenceStorageModule } from './evidence-storage/evidence-storage.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ApiErrorFilter } from './common/api-error.filter';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FarmsModule,
    InsuranceModule,
    ScoringModule,
    FarmDataModule,
    AdminModule,
    CRSModule,
    RewardModule,
    DemoSeedModule,
    CarbonProjectModule,
    CorporateModule,
    ConsentModule,
    EvidenceStorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: ApiErrorFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
