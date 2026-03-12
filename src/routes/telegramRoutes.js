import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateLinkCode,
  setupTelegramWebhook,
  telegramStatus,
  telegramWebhook,
  unlinkTelegram,
} from '../controllers/telegramController.js';

const router = Router();

router.get('/status', asyncHandler(telegramStatus));
router.post('/generate-link', asyncHandler(generateLinkCode));
router.delete('/unlink', asyncHandler(unlinkTelegram));
router.post('/setup-webhook', asyncHandler(setupTelegramWebhook));

export const telegramPublicRouter = Router();
telegramPublicRouter.post('/webhook', asyncHandler(telegramWebhook));

export default router;
