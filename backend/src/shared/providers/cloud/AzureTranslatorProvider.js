class AzureTranslatorProvider {
  constructor(endpoint, apiKey, region) {
    this.endpoint = endpoint || process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com/';
    this.apiKey = apiKey || process.env.AZURE_TRANSLATOR_KEY;
    this.region = region || process.env.AZURE_TRANSLATOR_REGION || 'global';
    this.allowedLangs = ['en', 'vi', 'ja', 'zh-Hans', 'fr', 'de', 'es', 'ko'];
  }

  async translateText(text, targetLang = 'en') {
    const checkedAt = new Date().toISOString();
    const safeTarget = this.allowedLangs.includes(targetLang) ? targetLang : 'en';
    const safeText = (text || '').slice(0, 300);

    if (!this.apiKey) {
      return {
        translatedText: `[Fallback translation to ${safeTarget}]: ${safeText}`,
        sourceLanguage: 'vi',
        targetLanguage: safeTarget,
        checkedAt,
        provider: 'azure-translator-fallback',
      };
    }

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/translate?api-version=3.0&to=${safeTarget}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Ocp-Apim-Subscription-Region': this.region,
        },
        body: JSON.stringify([{ text: safeText }]),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Azure Translator HTTP error ${response.status}`);
      }

      const data = await response.json();
      const firstResult = data?.[0];
      const translation = firstResult?.translations?.[0]?.text || safeText;
      const detectedSrc = firstResult?.detectedLanguage?.language || 'vi';

      return {
        translatedText: translation,
        sourceLanguage: detectedSrc,
        targetLanguage: safeTarget,
        checkedAt,
        provider: 'azure-translator',
      };
    } catch (err) {
      return {
        translatedText: `[Fallback translation to ${safeTarget}]: ${safeText}`,
        sourceLanguage: 'vi',
        targetLanguage: safeTarget,
        checkedAt,
        provider: 'azure-translator-fallback',
        error: err.message,
      };
    }
  }
}

module.exports = AzureTranslatorProvider;
