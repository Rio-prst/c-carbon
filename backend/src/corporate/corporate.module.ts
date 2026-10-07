import { Module } from '@nestjs/common';
import { CorporateService } from './corporate.service';
import { CorporateRepository } from './corporate.repository';
import { CorporateController } from './corporate.controller';
import { CORPORATE_REPOSITORY } from './corporate.repository.interface';
import { CarbonProjectModule } from '../carbon-project/carbon-project.module';

@Module({
  imports: [CarbonProjectModule],
  controllers: [CorporateController],
  providers: [
    CorporateService,
    // Registered under the token only: a second registration under the class
    // token would build a second repository instance.
    { provide: CORPORATE_REPOSITORY, useClass: CorporateRepository },
  ],
  exports: [CorporateService, CORPORATE_REPOSITORY],
})
export class CorporateModule {}
