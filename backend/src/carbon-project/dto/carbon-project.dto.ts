import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createCarbonProjectSchema = z.object({
  name: z.string().trim().min(3).max(120),
  region: z.string().trim().min(2).max(120),
  commodityFocus: z.string().trim().min(2).max(100),
});

export class CreateCarbonProjectDto extends createZodDto(
  createCarbonProjectSchema,
) {}

export const updateCarbonProjectStatusSchema = z.object({
  status: z.string().trim().min(1),
});

export class UpdateCarbonProjectStatusDto extends createZodDto(
  updateCarbonProjectStatusSchema,
) {}
