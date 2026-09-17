import type { UserRole } from '../generated/prisma/client.js';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

export interface IUsersRepository {
  create(input: CreateUserInput): Promise<PublicUser>;
}
