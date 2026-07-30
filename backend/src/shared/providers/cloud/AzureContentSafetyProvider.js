class AzureContentSafetyProvider {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint || process.env.AZURE_CONTENT_SAFETY_ENDPOINT || 'https://cog-safety-smartroommate-3b93b.cognitiveservices.azure.com/';
    this.apiKey = apiKey || process.env.AZURE_CONTENT_SAFETY_KEY;
  }

  async analyzeText(text) {
    const checkedAt = new Date().toISOString();
    if (!this.apiKey) {
      return {
        allowed: true,
        categories: [],
        severity: 'low',
        requestId: 'fallback-no-key',
        checkedAt,
        provider: 'azure-content-safety-fallback',
      };
    }

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/contentsafety/text:analyze?api-version=2023-10-01`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: JSON.stringify({ text: text.slice(0, 1000) }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Content Safety HTTP error ${response.status}`);
      }

      const data = await response.json();
      const categoriesAnalysis = data.categoriesAnalysis || [];
      const flagged = categoriesAnalysis.some((c) => c.severity > 2);

      return {
        allowed: !flagged,
        categories: categoriesAnalysis.map((c) => ({
          category: c.category,
          severity: c.severity,
        })),
        severity: flagged ? 'high' : 'low',
        requestId: response.headers.get('apim-request-id') || 'cs-' + Date.now(),
        checkedAt,
        provider: 'azure-content-safety',
      };
    } catch (err) {
      return {
        allowed: true, // safe fallback
        categories: [],
        severity: 'low',
        requestId: 'fallback-err',
        checkedAt,
        provider: 'azure-content-safety-fallback',
        error: err.message,
      };
    }
  }
}

module.exports = AzureContentSafetyProvider;
