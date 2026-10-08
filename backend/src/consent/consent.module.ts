import { Module } from '@nestjs/common';
import { ConsentService } from './consent.service';
import { ConsentRepository } from './consent.repository';
import { ConsentController } from './consent.controller';
import { CONSENT_REPOSITORY } from './consent.repository.interface';

@Module({
  controllers: [ConsentController],
  providers: [
    ConsentService,
    // Registered under the token only: a second registration under the class
    // token would build a second repository instance with its own state.
    { provide: CONSENT_REPOSITORY, useClass: ConsentRepository },
  ],
  // Exported so carbon aggregation can consult consent as a governance boundary.
  exports: [ConsentService, CONSENT_REPOSITORY],
})
export class ConsentModule {}
