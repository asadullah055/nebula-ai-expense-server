import axios from 'axios';
import { env } from '../config/env.js';

const baseUrl = env.telegramBotToken
  ? `https://api.telegram.org/bot${env.telegramBotToken}`
  : null;

const fileBaseUrl = env.telegramBotToken
  ? `https://api.telegram.org/file/bot${env.telegramBotToken}`
  : null;

export class TelegramApi {
  async call(method, payload) {
    if (!baseUrl) {
      throw new Error('Telegram bot token is not configured');
    }

    const { data } = await axios.post(`${baseUrl}/${method}`, payload);
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description || 'Unknown'}`);
    }

    return data.result;
  }

  async getFile(fileId) {
    return this.call('getFile', { file_id: fileId });
  }

  async downloadFile(filePath) {
    if (!fileBaseUrl) {
      throw new Error('Telegram bot token is not configured');
    }

    const { data } = await axios.get(`${fileBaseUrl}/${filePath}`, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(data);
  }

  async sendMessage(chatId, text) {
    return this.call('sendMessage', {
      chat_id: chatId,
      text,
    });
  }

  async setWebhook(url, secretToken) {
    return this.call('setWebhook', {
      url,
      secret_token: secretToken,
    });
  }
}
