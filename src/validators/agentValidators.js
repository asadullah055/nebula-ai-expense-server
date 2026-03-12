import { z } from 'zod';
import { COMMAND_SOURCES } from '../constants/domain.js';

export const commandSchema = z.object({
  input: z.string().min(1).max(500),
  source: z
    .enum([
      COMMAND_SOURCES.WEB,
      COMMAND_SOURCES.TELEGRAM_TEXT,
      COMMAND_SOURCES.TELEGRAM_VOICE,
      COMMAND_SOURCES.AGENT,
    ])
    .default(COMMAND_SOURCES.WEB),
  workspaceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});
