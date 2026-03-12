import { TelegramService } from '../services/TelegramService.js';
import { env } from '../config/env.js';

const telegramService = new TelegramService();

export const telegramStatus = async (req, res) => {
  const status = await telegramService.getStatus(req.user.id);
  res.json(status);
};

export const generateLinkCode = async (req, res) => {
  const result = await telegramService.generateLinkCode(req.user.id);
  res.status(201).json(result);
};

export const unlinkTelegram = async (req, res) => {
  const result = await telegramService.unlink(req.user.id);
  res.json(result);
};

export const telegramWebhook = async (req, res) => {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (env.telegramWebhookSecret && secret !== env.telegramWebhookSecret) {
    return res.status(403).json({ message: 'Invalid telegram webhook secret' });
  }

  await telegramService.handleWebhook(req.body);
  return res.json({ ok: true });
};

export const setupTelegramWebhook = async (_req, res) => {
  if (!env.telegramBotToken) {
    return res.status(400).json({ message: 'TELEGRAM_BOT_TOKEN is missing' });
  }

  const url = `${env.appBaseUrl}${env.telegramWebhookPath}`;
  await telegramService.telegramApi.setWebhook(url, env.telegramWebhookSecret || undefined);

  return res.json({ success: true, url });
};
