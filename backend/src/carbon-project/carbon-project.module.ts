import { Module } from '@nestjs/common';
import { CarbonProjectService } from './carbon-project.service';
import { CarbonProjectRepository } from './carbon-project.repository';
import { ProjectEligibilityProvider } from './project-eligibility.provider';
import {
  AdminCarbonProjectController,
  CarbonProjectController,
} from './carbon-project.controller';
import { CARBON_PROJECT_REPOSITORY } from './carbon-project.repository.interface';
import { PROJECT_ELIGIBILITY_PROVIDER } from './project-eligibility.provider.interface';
import { FarmsModule } from '../farms/farms.module';
import { FarmDataModule } from '../farm-data/farm-data.module';
import { AdminModule } from '../admin/admin.module';
import { ConsentModule } from '../consent/consent.module';

@Module({
  imports: [FarmsModule, FarmDataModule, AdminModule, ConsentModule],
  controllers: [CarbonProjectController, AdminCarbonProjectController],
  providers: [
    CarbonProjectService,
    // Registered under the token only: a second registration under the class
    // token would build a second repository instance with its own state.
    {
      provide: CARBON_PROJECT_REPOSITORY,
      useClass: CarbonProjectRepository,
    },
    {
      provide: PROJECT_ELIGIBILITY_PROVIDER,
      useClass: ProjectEligibilityProvider,
    },
  ],
  exports: [CarbonProjectService, CARBON_PROJECT_REPOSITORY],
})
export class CarbonProjectModule {}
