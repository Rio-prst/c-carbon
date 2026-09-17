import type { PrismaService } from '../prisma/prisma.service';
import { UsersRepository } from './users.repository';

describe('UsersRepository', () => {
  const userCreate = jest.fn();
  let repository: UsersRepository;

  beforeEach(() => {
    userCreate.mockReset();
    repository = new UsersRepository({
      user: { create: userCreate },
    } as unknown as PrismaService);
  });

  it('creates a user passing all input fields through', async () => {
    const createdAt = new Date();
    userCreate.mockResolvedValue({
      id: 'user-1',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
      createdAt,
    });

    const result = await repository.create({
      name: 'Budi',
      email: 'budi@example.com',
      passwordHash: 'hashed-password',
      role: 'FARMER',
    });

    const [, { data, select }] = userCreate.mock.calls[0] as [
      unknown,
      { data: Record<string, unknown>; select: Record<string, boolean> },
    ];

    expect(data).toEqual({
      name: 'Budi',
      email: 'budi@example.com',
      passwordHash: 'hashed-password',
      role: 'FARMER',
    });

    expect(select.passwordHash).toBeUndefined();

    expect(result).toEqual({
      id: 'user-1',
      name: 'Budi',
      email: 'budi@example.com',
      role: 'FARMER',
      createdAt,
    });
  });
});
