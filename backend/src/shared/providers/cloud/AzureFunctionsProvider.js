class AzureFunctionsProvider {
  constructor(functionAppUrl) {
    const rawUrl = functionAppUrl || process.env.AZURE_FUNCTIONS_URL || 'https://func-smartroommate-ea.azurewebsites.net';
    this.functionAppUrl = rawUrl.replace(/\/+$/, '');
  }

  async checkHealth() {
    const checkedAt = new Date().toISOString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `${this.functionAppUrl}/api/health-check`;
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Azure Functions HTTP error ${response.status}`);
      }

      const data = await response.json();
      const requestId = response.headers.get('x-ms-request-id') || response.headers.get('apim-request-id') || `func-${Date.now()}`;

      return {
        provider: 'azure-functions',
        functionName: 'health-check',
        httpStatus: response.status,
        requestId,
        data,
        fallbackUsed: false,
        checkedAt,
      };
    } catch (err) {
      return {
        provider: 'azure-functions-fallback',
        functionName: 'health-check',
        fallbackUsed: true,
        error: err.message,
        checkedAt,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = AzureFunctionsProvider;
