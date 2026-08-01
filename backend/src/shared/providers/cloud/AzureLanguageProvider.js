class AzureLanguageProvider {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint || process.env.AZURE_LANGUAGE_ENDPOINT || 'https://cog-lang-smartroommate-053fb.cognitiveservices.azure.com/';
    this.apiKey = apiKey || process.env.AZURE_LANGUAGE_KEY;
  }

  async analyzeText(text) {
    const checkedAt = new Date().toISOString();
    if (!this.apiKey) {
      return {
        sentiment: 'neutral',
        confidence: 0,
        keyPhrases: [],
        checkedAt,
        provider: 'azure-language-fallback',
        fallbackUsed: true,
        error: 'Thiếu AZURE_LANGUAGE_KEY',
      };
    }

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/language/:analyze-text?api-version=2023-04-01`;
      const sentimentPayload = {
        kind: 'SentimentAnalysis',
        analysisInput: {
          documents: [{ id: '1', language: 'vi', text: text.slice(0, 500) }],
        },
      };
      const keyPhrasePayload = {
        kind: 'KeyPhraseExtraction',
        analysisInput: {
          documents: [{ id: '1', language: 'vi', text: text.slice(0, 500) }],
        },
      };
      const request = (payload) => fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
      const [sentimentResponse, keyPhraseResponse] = await Promise.all([
        request(sentimentPayload), request(keyPhrasePayload),
      ]);
      if (!sentimentResponse.ok || !keyPhraseResponse.ok) {
        throw new Error(`AI Language HTTP error ${sentimentResponse.status}/${keyPhraseResponse.status}`);
      }
      const [sentimentData, keyPhraseData] = await Promise.all([
        sentimentResponse.json(), keyPhraseResponse.json(),
      ]);
      const doc = sentimentData.results?.documents?.[0];
      const phraseDoc = keyPhraseData.results?.documents?.[0];
      const sentiment = doc?.sentiment || 'neutral';
      const scoreObj = doc?.confidenceScores || {};
      const maxScore = Math.max(scoreObj.positive || 0, scoreObj.neutral || 0, scoreObj.negative || 0);

      return {
        sentiment,
        confidence: Number((maxScore || 0.9).toFixed(2)),
        keyPhrases: phraseDoc?.keyPhrases || [],
        checkedAt,
        provider: 'azure-ai-language',
        httpStatus: sentimentResponse.status,
        fallbackUsed: false,
      };
    } catch (err) {
      return {
        sentiment: 'neutral',
        confidence: 0,
        keyPhrases: [],
        checkedAt,
        provider: 'azure-language-fallback',
        fallbackUsed: true,
        error: err.message,
      };
    }
  }
}

module.exports = AzureLanguageProvider;
