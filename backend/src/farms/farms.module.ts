import { Module } from '@nestjs/common';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { FARMS_REPOSITORY } from './farms.repository.interface';
import { FarmsRepository } from './farms.repository';

@Module({
  controllers: [FarmsController],
  providers: [
    FarmsService,
    { provide: FARMS_REPOSITORY, useClass: FarmsRepository },
  ],
  exports: [FarmsService],
})
export class FarmsModule {}
