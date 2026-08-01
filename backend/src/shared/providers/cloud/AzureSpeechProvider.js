class AzureSpeechProvider {
  constructor(endpoint, apiKey, region) {
    this.endpoint = endpoint || process.env.AZURE_SPEECH_ENDPOINT || 'https://eastasia.api.cognitive.microsoft.com/';
    this.apiKey = apiKey || process.env.AZURE_SPEECH_KEY;
    this.region = region || process.env.AZURE_SPEECH_REGION || 'eastasia';
  }

  async synthesizeText(text) {
    const result = await this.synthesizeAudio(text);
    if (result.fallbackUsed) return result;
    return {
      status: 'success',
      audioFormat: result.audioFormat,
      textSample: result.textSample,
      audioLengthBytes: result.audio.length,
      checkedAt: result.checkedAt,
      provider: result.provider,
      httpStatus: result.httpStatus,
      fallbackUsed: false,
    };
  }

  async synthesizeAudio(text) {
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
        fallbackUsed: true,
        error: 'Thiếu AZURE_SPEECH_KEY',
      };
    }

    try {
      const url = `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      const escapedText = safeText.replace(/[<>&'"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]);
      const ssml = `<speak version='1.0' xml:lang='vi-VN'><voice xml:lang='vi-VN' xml:gender='Female' name='vi-VN-HoaiMyNeural'>${escapedText}</voice></speak>`;

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

      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        status: 'success',
        audioFormat: 'audio/mpeg',
        textSample: safeText,
        audio: buffer,
        checkedAt,
        provider: 'azure-ai-speech',
        httpStatus: response.status,
        fallbackUsed: false,
      };
    } catch (err) {
      return {
        status: 'demo',
        audioFormat: 'audio/mpeg',
        textSample: safeText,
        audioLengthBytes: 4096,
        checkedAt,
        provider: 'azure-speech-fallback',
        fallbackUsed: true,
        error: err.message,
      };
    }
  }
}

module.exports = AzureSpeechProvider;
