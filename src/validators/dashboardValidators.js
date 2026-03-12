import { z } from 'zod';

export const dashboardQuerySchema = z.object({
  workspaceId: z.string().optional(),
  period: z.enum(['7d', '30d', 'last_month', 'custom']).default('30d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
