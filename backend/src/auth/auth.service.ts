import { ConflictException, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { USERS_REPOSITORY } from '../users/users.repository.interface';
import type { IUsersRepository } from '../users/users.repository.interface';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async register(dto: RegisterDto) {
    // Registration role is assigned by the backend. The MVP registration flow
    // creates farmers; corporate/admin identities use separate flows.
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      return await this.usersRepository.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: 'FARMER',
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          statusCode: 409,
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'An account with this email already exists',
          details: {},
        });
      }
      throw error;
    }
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
