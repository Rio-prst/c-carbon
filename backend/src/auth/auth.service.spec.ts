import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { jest } from '@jest/globals';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import type {
  AuthUser,
  CreateUserInput,
  PublicUser,
} from '../users/users.repository.interface';
import type { JwtPayload } from './types/jwt-payload';

describe('AuthService', () => {
  let service: AuthService;
  const userCreate = jest.fn<(input: CreateUserInput) => Promise<PublicUser>>();
  const findByEmail = jest.fn<(email: string) => Promise<AuthUser | null>>();
  const findById = jest.fn<(id: string) => Promise<PublicUser | null>>();
  const signAsync = jest.fn<(payload: JwtPayload) => Promise<string>>();

  const authUser: AuthUser = {
    id: 'user-1',
    name: 'Budi',
    email: 'budi@example.com',
    role: 'FARMER',
    passwordHash: 'hashed-password',
    createdAt: new Date(),
  };

  beforeEach(() => {
    userCreate.mockReset();
    findByEmail.mockReset();
    findById.mockReset();
    signAsync.mockReset();
    service = new AuthService({ create: userCreate, findByEmail, findById }, {
      signAsync,
    } as unknown as JwtService);
  });

  it('creates a farmer with a hashed password', async () => {
    const createdAt = new Date();
    userCreate.mockResolvedValue({
      id: 'user-1',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
      createdAt,
    });

    const result = await service.register({
      name: 'Budi',
      email: 'budi@example.com',
      password: 'password123',
    });

    const [input] = userCreate.mock.calls[0] as [{ passwordHash: string }];

    expect(input.passwordHash).not.toBe('password123');
    expect(await bcrypt.compare('password123', input.passwordHash)).toBe(true);
    expect(input).toMatchObject({
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
    });

    expect(result).toEqual({
      id: 'user-1',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
      createdAt,
    });
  });

  it('throws ConflictException on duplicate email', async () => {
    const err = new Error('unique violation');
    (err as { code?: string }).code = 'P2002';
    userCreate.mockImplementation(() => Promise.reject(err));

    await expect(
      service.register({
        name: 'Budi',
        email: 'budi@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns a token and the user identity on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    findByEmail.mockResolvedValue({ ...authUser, passwordHash });
    signAsync.mockResolvedValue('jwt-token');

    const result = await service.login({
      email: 'budi@example.com',
      password: 'password123',
    });

    expect(signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      role: 'FARMER',
    });
    expect(result).toEqual({
      token: 'jwt-token',
      user: {
        id: 'user-1',
        name: 'Budi',
        email: 'budi@example.com',
        role: 'FARMER',
      },
    });
  });

  it('rejects login when the password is wrong', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    findByEmail.mockResolvedValue({ ...authUser, passwordHash });

    await expect(
      service.login({ email: 'budi@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('rejects login when the email is not registered', async () => {
    findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'ghost@example.com', password: 'password123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(signAsync).not.toHaveBeenCalled();
  });

  it('returns the public user identity for an existing id', async () => {
    const createdAt = new Date();
    findById.mockResolvedValue({
      id: 'user-1',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
      createdAt,
    });

    const result = await service.me('user-1');

    expect(result).toEqual({
      id: 'user-1',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
      createdAt,
    });
    expect(findById).toHaveBeenCalledWith('user-1');
  });

  it('rejects me() when the account does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(service.me('missing-user')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
