import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

export class RegisterDto extends createZodDto(registerSchema) {}
