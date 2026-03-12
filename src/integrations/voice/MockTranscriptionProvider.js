export class MockTranscriptionProvider {
  async transcribe() {
    return '[voice transcription unavailable: configure VOICE_PROVIDER=openai]';
  }
}
