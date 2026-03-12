import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateLinkCode,
  setupTelegramWebhook,
  telegramWebhookInfo,
  telegramStatus,
  telegramWebhook,
  unlinkTelegram,
} from '../controllers/telegramController.js';

const router = Router();

router.get('/status', asyncHandler(telegramStatus));
router.post('/generate-link', asyncHandler(generateLinkCode));
router.delete('/unlink', asyncHandler(unlinkTelegram));
router.post('/setup-webhook', asyncHandler(setupTelegramWebhook));
router.get('/webhook-info', asyncHandler(telegramWebhookInfo));

export const telegramPublicRouter = Router();
telegramPublicRouter.post('/webhook', asyncHandler(telegramWebhook));

export default router;
