import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateFarmDataStatusSchema = z
  .object({
    status: z.enum(['SELF_REPORTED', 'REVIEW', 'VERIFIED', 'REJECTED']),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
  })
  .refine(
    (value) => value.status !== 'REJECTED' || value.rejectionReason != null,
    {
      message: 'A rejection reason is required when rejecting farm data',
      path: ['rejectionReason'],
    },
  );

export class UpdateFarmDataStatusDto extends createZodDto(
  updateFarmDataStatusSchema,
) {}
