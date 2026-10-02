import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const rewardEventTypeSchema = z.enum([
  'FARM_DATA_SUBMISSION',
  'VERIFICATION',
  'FSS_IMPROVEMENT',
  'SUSTAINABLE_PRACTICE',
  'MILESTONE_BONUS',
]);

export const createRewardEventSchema = z.object({
  user_id: z.string().uuid().optional(),
  event_type: rewardEventTypeSchema,
  points: z.number().int().positive().optional(),
  description: z.string().max(255).optional(),
});

export class CreateRewardEventDto extends createZodDto(
  createRewardEventSchema,
) {}
