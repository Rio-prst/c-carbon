import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const userCreate = jest.fn();

  beforeEach(() => {
    userCreate.mockReset();
    service = new AuthService({
      create: userCreate,
    });
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
    userCreate.mockRejectedValue(err);

    await expect(
      service.register({
        name: 'Budi',
        email: 'budi@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
