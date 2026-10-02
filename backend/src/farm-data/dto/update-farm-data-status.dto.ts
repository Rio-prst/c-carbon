import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateFarmDataStatusSchema = z.object({
  status: z.enum(['SELF_REPORTED', 'REVIEW', 'VERIFIED', 'REJECTED']),
});

export class UpdateFarmDataStatusDto extends createZodDto(
  updateFarmDataStatusSchema,
) {}
