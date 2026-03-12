import { env } from '../config/env.js';
import { TelegramApi } from '../integrations/telegramApi.js';
import { MockTranscriptionProvider } from '../integrations/voice/MockTranscriptionProvider.js';
import { OpenAiTranscriptionProvider } from '../integrations/voice/OpenAiTranscriptionProvider.js';

export class VoiceTranscriptionService {
  constructor() {
    this.telegramApi = new TelegramApi();
    this.provider = env.voiceProvider === 'openai'
      ? new OpenAiTranscriptionProvider()
      : new MockTranscriptionProvider();
  }

  async transcribeTelegramVoice(fileId) {
    const file = await this.telegramApi.getFile(fileId);
    const audioBuffer = await this.telegramApi.downloadFile(file.file_path);
    const mb = audioBuffer.length / (1024 * 1024);

    if (mb > env.voiceMaxMb) {
      throw new Error(`Voice file exceeds ${env.voiceMaxMb}MB limit`);
    }

    return this.provider.transcribe(audioBuffer);
  }
}
