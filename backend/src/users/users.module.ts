import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { USERS_REPOSITORY } from './users.repository.interface';

@Module({
  providers: [{ provide: USERS_REPOSITORY, useClass: UsersRepository }],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
