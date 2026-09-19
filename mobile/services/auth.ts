import { apiRequest } from '../lib/api';
import type {
  AuthUser,
  LoginInput,
  LoginResponse,
  RegisterInput,
} from '../types/auth';

export function register(input: RegisterInput): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/register', {
    method: 'POST',
    body: input,
  });
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function fetchCurrentUser(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', { token });
}