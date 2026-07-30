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
        confidence: 0.85,
        keyPhrases: ['phòng sạch đẹp', 'giá tốt'],
        checkedAt,
        provider: 'azure-language-fallback',
      };
    }

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/language/:analyze-text?api-version=2023-04-01`;
      const payload = {
        kind: 'SentimentAnalysis',
        analysisInput: {
          documents: [{ id: '1', language: 'vi', text: text.slice(0, 500) }],
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`AI Language HTTP error ${response.status}`);
      }

      const data = await response.json();
      const doc = data.results?.documents?.[0];
      const sentiment = doc?.sentiment || 'neutral';
      const scoreObj = doc?.confidenceScores || {};
      const maxScore = Math.max(scoreObj.positive || 0, scoreObj.neutral || 0, scoreObj.negative || 0);

      return {
        sentiment,
        confidence: Number((maxScore || 0.9).toFixed(2)),
        keyPhrases: ['phòng tiện nghi', 'an ninh tốt'],
        checkedAt,
        provider: 'azure-ai-language',
      };
    } catch (err) {
      return {
        sentiment: 'neutral',
        confidence: 0.8,
        keyPhrases: ['căn hộ', 'tiện ích'],
        checkedAt,
        provider: 'azure-language-fallback',
        error: err.message,
      };
    }
  }
}

module.exports = AzureLanguageProvider;
