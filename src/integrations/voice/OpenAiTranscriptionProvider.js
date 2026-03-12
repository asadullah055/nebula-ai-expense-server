import { writeFile, rm } from 'fs/promises';
import path from 'path';
import os from 'os';
import { createReadStream } from 'fs';
import { openAiClient } from '../openaiClient.js';

export class OpenAiTranscriptionProvider {
  async transcribe(buffer) {
    if (!openAiClient) {
      throw new Error('OpenAI client not configured for transcription');
    }

    const tempFile = path.join(os.tmpdir(), `tg-voice-${Date.now()}.ogg`);
    await writeFile(tempFile, buffer);

    try {
      const response = await openAiClient.audio.transcriptions.create({
        model: 'gpt-4o-mini-transcribe',
        file: createReadStream(tempFile),
      });

      return response.text || '';
    } finally {
      await rm(tempFile, { force: true });
    }
  }
}
