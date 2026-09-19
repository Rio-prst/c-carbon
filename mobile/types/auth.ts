export type UserRole = 'FARMER' | 'CORPORATE' | 'ADMIN';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};