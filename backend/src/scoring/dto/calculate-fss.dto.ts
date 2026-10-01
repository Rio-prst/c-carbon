import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const calculateFSSSchema = z.object({
  yieldKg: z.coerce.number().optional(),
  waterUsage: z.coerce.number().optional(),
  fertilizerUsage: z.coerce.number().optional(),
  pesticideUsage: z.coerce.number().optional(),
  wasteManagementPractice: z.string().optional(),
  soilPractice: z.string().optional(),
  energyUsage: z.coerce.number().optional(),
  lowCarbonPractice: z.boolean().optional(),
  farmDataStatus: z.string().optional(),
});

export class CalculateFSSDto extends createZodDto(calculateFSSSchema) {}
