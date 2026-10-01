import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFarmDataSchema = z.object({
  farmSeasonId: z.string().uuid(),
  yieldKg: z.coerce.number().optional(),
  waterUsage: z.coerce.number().optional(),
  fertilizerUsage: z.coerce.number().optional(),
  pesticideUsage: z.coerce.number().optional(),
  wasteManagementPractice: z.string().optional(),
  soilPractice: z.string().optional(),
  energyUsage: z.coerce.number().optional(),
  lowCarbonPractice: z.boolean().optional(),
});

export class CreateFarmDataDto extends createZodDto(createFarmDataSchema) {}
