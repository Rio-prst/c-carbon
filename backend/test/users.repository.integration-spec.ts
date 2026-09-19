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

  it('returns the stored user including the password hash by email', async () => {
    const created = await repository.create({
      name: 'Budi',
      email: 'budi@example.com',
      passwordHash: 'hashed-password',
      role: 'FARMER',
    });

    const found = await repository.findByEmail('budi@example.com');

    expect(found).not.toBeNull();
    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        name: 'Budi',
        email: 'budi@example.com',
        passwordHash: 'hashed-password',
        role: 'FARMER',
      }),
    );
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it('returns null when no user matches the email', async () => {
    await expect(
      repository.findByEmail('missing@example.com'),
    ).resolves.toBeNull();
  });

  it('returns the public user by id without leaking the password hash', async () => {
    const created = await repository.create({
      name: 'Budi',
      email: 'budi@example.com',
      passwordHash: 'hashed-password',
      role: 'FARMER',
    });

    const found = await repository.findById(created.id);

    expect(found).not.toBeNull();
    expect(found).toEqual(
      expect.objectContaining({
        id: created.id,
        name: 'Budi',
        email: 'budi@example.com',
        role: 'FARMER',
      }),
    );
    expect(found?.createdAt).toBeInstanceOf(Date);
    expect((found as { passwordHash?: string }).passwordHash).toBeUndefined();
  });

  it('returns null when no user matches the id', async () => {
    await expect(
      repository.findById('00000000-0000-0000-0000-000000000000'),
    ).resolves.toBeNull();
  });
});
