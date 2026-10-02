import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFarmSeasonSchema = z.object({
  seasonLabel: z.string().trim().min(1).max(64).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sequenceNumber: z.number().int().positive().optional(),
});

export class CreateFarmSeasonDto extends createZodDto(createFarmSeasonSchema) {}
