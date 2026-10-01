import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createInsuranceSchema = z.object({
  partner: z.string().trim().min(1),
  status: z.enum(['PENDING', 'ACTIVE', 'EXPIRED']).default('PENDING'),
});

export class CreateInsuranceDto extends createZodDto(createInsuranceSchema) {}
