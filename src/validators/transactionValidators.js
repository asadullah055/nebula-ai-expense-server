import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.coerce.number().positive(),
  title: z.string().trim().min(1),
  category: z.string().trim().min(1).optional(),
  note: z.string().optional(),
  date: z.coerce.date(),
  workspaceId: z.string(),
  source: z.enum(['web', 'telegram_text', 'telegram_voice', 'agent']).default('web'),
  rawInput: z.string().optional(),
});

export const listTransactionsQuerySchema = z.object({
  workspaceId: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});
