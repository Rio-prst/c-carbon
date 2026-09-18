import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../src/prisma/prisma.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersRepository } from '../src/users/users.repository';

describe('UsersRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: UsersRepository;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule],
    }).compile();

    prisma = moduleRef.get(PrismaService);
    await prisma.$connect();
    repository = new UsersRepository(prisma);
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('persists a created user to the database', async () => {
    const result = await repository.create({
      name: 'Budi',
      email: 'budi@example.com',
      passwordHash: 'hashed-password',
      role: 'FARMER',
    });

    expect(result).toEqual(
      expect.objectContaining({
        name: 'Budi',
        email: 'budi@example.com',
        role: 'FARMER',
      }),
    );
    expect(result.createdAt).toBeInstanceOf(Date);
    expect((result as { passwordHash?: string }).passwordHash).toBeUndefined();

    const stored = await prisma.user.findUnique({
      where: { id: result.id },
    });

    expect(stored).not.toBeNull();
    expect(stored).toEqual(
      expect.objectContaining({
        id: result.id,
        name: 'Budi',
        email: 'budi@example.com',
        passwordHash: 'hashed-password',
        role: 'FARMER',
      }),
    );
  });

  it('throws a unique violation when the email is already taken', async () => {
    const input = {
      name: 'Budi',
      email: 'duplicate@example.com',
      passwordHash: 'hashed-password',
      role: 'FARMER' as const,
    };

    await repository.create(input);

    const err = await repository
      .create({ ...input, name: 'Another Budi' })
      .then(
        () => null,
        (e: unknown) => e,
      );

    expect(err).not.toBeNull();
    expect((err as { code?: string }).code).toBe('P2002');
  });
});
