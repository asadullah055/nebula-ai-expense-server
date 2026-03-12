import crypto from 'crypto';
import dayjs from 'dayjs';
import { TelegramIntegration } from '../models/TelegramIntegration.js';
import { TelegramApi } from '../integrations/telegramApi.js';
import { AgentCommandService } from './AgentCommandService.js';
import { VoiceTranscriptionService } from './VoiceTranscriptionService.js';
import { env } from '../config/env.js';

const generateCode = () => `ET-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
const normalizeBotUsername = (value) => value.trim().replace(/^@/, '');
const buildDeepLinkUrl = (linkCode) => {
  const botUsername = normalizeBotUsername(env.telegramBotUsername || '');
  if (!botUsername || !linkCode) return null;

  return `https://t.me/${encodeURIComponent(botUsername)}?start=${encodeURIComponent(linkCode)}`;
};

export class TelegramService {
  constructor() {
    this.telegramApi = new TelegramApi();
    this.agentCommandService = new AgentCommandService();
    this.voiceTranscriptionService = new VoiceTranscriptionService();
  }

  async getStatus(userId) {
    const integration = await TelegramIntegration.findOne({ userId }).lean();
    const linkCode = integration?.linkCode || null;

    return {
      isLinked: Boolean(integration?.isLinked),
      telegramId: integration?.telegramId || null,
      telegramUsername: integration?.telegramUsername || null,
      linkCode,
      linkCodeExpiresAt: integration?.linkCodeExpiresAt || null,
      deepLinkUrl: buildDeepLinkUrl(linkCode),
    };
  }

  async generateLinkCode(userId) {
    const linkCode = generateCode();
    const expiresAt = dayjs().add(15, 'minute').toDate();

    const integration = await TelegramIntegration.findOneAndUpdate(
      { userId },
      {
        $set: {
          linkCode,
          linkCodeExpiresAt: expiresAt,
        },
        $setOnInsert: {
          userId,
          isLinked: false,
        },
      },
      {
        upsert: true,
        new: true,
      }
    ).lean();

    return {
      linkCode: integration.linkCode,
      expiresAt: integration.linkCodeExpiresAt,
      deepLinkUrl: buildDeepLinkUrl(integration.linkCode),
    };
  }

  async unlink(userId) {
    await TelegramIntegration.findOneAndUpdate(
      { userId },
      {
        $set: {
          isLinked: false,
          telegramId: null,
          telegramUsername: '',
        },
      },
      { new: true }
    );

    return { success: true };
  }

  async linkAccountByCode({ code, telegramId, username }) {
    const integration = await TelegramIntegration.findOne({
      linkCode: code,
      linkCodeExpiresAt: { $gt: new Date() },
    });

    if (!integration) return false;

    integration.telegramId = telegramId;
    integration.telegramUsername = username;
    integration.isLinked = true;
    integration.linkCode = null;
    integration.linkCodeExpiresAt = null;
    await integration.save();

    return true;
  }

  async handleWebhook(update) {
    const message = update?.message;
    if (!message) return;

    const chatId = message.chat?.id;
    const telegramId = String(message.from?.id || '');
    const username = message.from?.username || '';
    const text = message.text?.trim();

    if (text?.startsWith('/start')) {
      const code = text.split(' ')[1]?.trim();
      if (code) {
        const linked = await this.linkAccountByCode({ code, telegramId, username });
        if (!linked) {
          await this.telegramApi.sendMessage(chatId, 'Invalid or expired link code. Generate a new code from web app.');
          return;
        }

        await this.telegramApi.sendMessage(chatId, 'Telegram linked successfully. You can now send expense commands.');
        return;
      }

      await this.telegramApi.sendMessage(
        chatId,
        'AI Expense Manager bot is online. Use /link <code> from web settings, or open a deep link from the web app.'
      );
      return;
    }

    if (text?.startsWith('/link')) {
      const code = text.split(' ')[1]?.trim();
      if (!code) {
        await this.telegramApi.sendMessage(chatId, 'Usage: /link ET-XXXXXX');
        return;
      }

      const linked = await this.linkAccountByCode({ code, telegramId, username });
      if (!linked) {
        await this.telegramApi.sendMessage(chatId, 'Invalid or expired link code. Generate a new code from web app.');
        return;
      }

      await this.telegramApi.sendMessage(chatId, 'Telegram linked successfully. You can now send expense commands.');
      return;
    }

    const integration = await TelegramIntegration.findOne({ telegramId, isLinked: true });
    if (!integration) {
      await this.telegramApi.sendMessage(
        chatId,
        'Your Telegram is not linked. Generate link code in web settings and send /link <code>.'
      );
      return;
    }

    let commandInput = text || '';
    let source = 'telegram_text';

    if (!commandInput && message.voice?.file_id) {
      source = 'telegram_voice';
      commandInput = await this.voiceTranscriptionService.transcribeTelegramVoice(message.voice.file_id);
    }

    if (!commandInput) {
      await this.telegramApi.sendMessage(chatId, 'Please send text or voice command.');
      return;
    }

    const result = await this.agentCommandService.processCommand({
      userId: integration.userId,
      input: commandInput,
      source,
      metadata: {
        chatId,
        telegramId,
      },
    });

    await this.telegramApi.sendMessage(chatId, result.response);
  }
}
