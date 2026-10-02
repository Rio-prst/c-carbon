import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createEvidenceSchema = z.object({
  farmDataId: z.string().uuid(),
  type: z.string().trim().min(1).max(64).optional(),
  url: z.string().url().optional(),
  fileName: z.string().trim().min(1).max(255).optional(),
});

export class CreateEvidenceDto extends createZodDto(createEvidenceSchema) {}
