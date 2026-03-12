import OpenAI from 'openai';
import { env } from '../config/env.js';

let client = null;

if (env.openAiApiKey) {
  client = new OpenAI({
    apiKey: env.openAiApiKey,
    baseURL: env.openAiBaseUrl,
  });
}

export const openAiClient = client;
