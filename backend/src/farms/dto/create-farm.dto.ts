import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFarmSchema = z.object({
  name: z.string().trim().min(1),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  landAreaHa: z.coerce.number().positive(),
  commodity: z.string().trim().min(1),
});

export class CreateFarmDto extends createZodDto(createFarmSchema) {}
