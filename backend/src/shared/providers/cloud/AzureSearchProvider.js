const { SearchIndexClient, SearchClient, AzureKeyCredential } = require('@azure/search-documents');

class AzureSearchProvider {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint || process.env.AZURE_SEARCH_ENDPOINT || 'https://srch-smartroommate-ea.search.windows.net';
    this.apiKey = apiKey || process.env.AZURE_SEARCH_KEY;
    this.indexName = 'rooms-index';
    this.indexClient = null;
    this.searchClient = null;

    if (this.endpoint && this.apiKey) {
      try {
        const credential = new AzureKeyCredential(this.apiKey);
        this.indexClient = new SearchIndexClient(this.endpoint, credential);
        this.searchClient = new SearchClient(this.endpoint, this.indexName, credential);
      } catch (err) {
        console.warn('AzureSearchProvider init warning:', err.message);
      }
    }
  }

  async getStatus() {
    const checkedAt = new Date().toISOString();

    if (!this.indexClient) {
      return {
        indexExists: false,
        documentCount: 0,
        indexName: this.indexName,
        checkedAt,
        provider: 'azure-search-fallback',
        error: 'Thiếu AZURE_SEARCH_KEY hoặc cấu hình endpoint',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const index = await this.indexClient.getIndex(this.indexName, { abortSignal: controller.signal });
      let documentCount = 0;
      try {
        const statistics = await this.indexClient.getIndexStatistics(this.indexName, { abortSignal: controller.signal });
        documentCount = statistics?.documentCount || 0;
      } catch (_statErr) {
        documentCount = 0;
      }

      return {
        indexExists: !!index,
        documentCount,
        indexName: this.indexName,
        checkedAt,
        provider: 'azure-ai-search',
      };
    } catch (err) {
      const sanitizedMsg = this.apiKey ? (err.message || '').replace(new RegExp(this.apiKey, 'g'), '[REDACTED]') : err.message;
      return {
        indexExists: false,
        documentCount: 0,
        indexName: this.indexName,
        checkedAt,
        provider: 'azure-search-fallback',
        error: sanitizedMsg,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async searchRooms(queryText, options = {}) {
    const checkedAt = new Date().toISOString();
    const rawQuery = typeof queryText === 'string' ? queryText.trim() : '';
    const safeQuery = rawQuery.slice(0, 100);
    const topLimit = Math.min(Math.max(parseInt(options.top, 10) || 10, 1), 20);

    if (!this.searchClient || !this.apiKey) {
      return {
        provider: 'azure-search-fallback',
        source: 'postgresql-fallback',
        count: 0,
        results: [],
        fallbackUsed: true,
        error: 'Thiếu cấu hình SearchClient',
        checkedAt,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const searchResults = await this.searchClient.search(safeQuery || '*', {
        top: topLimit,
        abortSignal: controller.signal,
      });

      const results = [];
      for await (const result of searchResults.results) {
        results.push({
          '@search.score': result.score,
          ...result.document,
        });
      }

      return {
        provider: 'azure-ai-search',
        source: 'azure-ai-search',
        indexName: this.indexName,
        indexExists: true,
        documentCount: results.length,
        query: safeQuery || '*',
        resultCount: results.length,
        results,
        fallbackUsed: false,
        checkedAt,
      };
    } catch (err) {
      const sanitizedMsg = this.apiKey ? (err.message || '').replace(new RegExp(this.apiKey, 'g'), '[REDACTED]') : err.message;
      return {
        provider: 'azure-search-fallback',
        source: 'postgresql-fallback',
        count: 0,
        results: [],
        fallbackUsed: true,
        error: sanitizedMsg,
        checkedAt,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = AzureSearchProvider;
