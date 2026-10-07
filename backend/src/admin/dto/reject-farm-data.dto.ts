import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const rejectFarmDataSchema = z.object({
  rejectionReason: z
    .string()
    .trim()
    .min(1, 'A rejection reason is required')
    .max(500),
});

export class RejectFarmDataDto extends createZodDto(rejectFarmDataSchema) {}
