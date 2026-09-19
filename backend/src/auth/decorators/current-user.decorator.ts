import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from '../types/jwt-payload';

type AuthenticatedRequest = Request & { user?: JwtPayload };

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload | undefined => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);
