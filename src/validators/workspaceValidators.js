import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(['company']),
  currency: z.string().min(3).max(6).default('USD'),
  monthlyExpenseLimit: z.number().min(0).default(0),
});

export const updateWorkspaceSchema = z.object({
  currency: z.string().min(3).max(6).optional(),
  monthlyExpenseLimit: z.number().min(0).optional(),
  name: z.string().min(2).max(80).optional(),
});

export const switchWorkspaceSchema = z.object({
  workspaceId: z.string().min(10),
});
