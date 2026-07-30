class AzureSpeechProvider {
  constructor(endpoint, apiKey, region) {
    this.endpoint = endpoint || process.env.AZURE_SPEECH_ENDPOINT || 'https://eastasia.api.cognitive.microsoft.com/';
    this.apiKey = apiKey || process.env.AZURE_SPEECH_KEY;
    this.region = region || process.env.AZURE_SPEECH_REGION || 'eastasia';
  }

  async synthesizeText(text) {
    const checkedAt = new Date().toISOString();
    const safeText = (text || 'Chào mừng bạn đến với Smart Roommate Matchmaker.').slice(0, 100);

    if (!this.apiKey) {
      return {
        status: 'demo',
        audioFormat: 'audio/mpeg',
        textSample: safeText,
        audioLengthBytes: 4096,
        checkedAt,
        provider: 'azure-speech-fallback',
      };
    }

    try {
      const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const ssml = `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' xml:gender='Female' name='vi-VN-HoaiMyNeural'>${safeText}</voice></speak>`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: ssml,
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Azure Speech HTTP error ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      return {
        status: 'success',
        audioFormat: 'audio/mpeg',
        textSample: safeText,
        audioLengthBytes: buffer.byteLength,
        checkedAt,
        provider: 'azure-ai-speech',
      };
    } catch (err) {
      return {
        status: 'demo',
        audioFormat: 'audio/mpeg',
        textSample: safeText,
        audioLengthBytes: 4096,
        checkedAt,
        provider: 'azure-speech-fallback',
        error: err.message,
      };
    }
  }
}

module.exports = AzureSpeechProvider;
