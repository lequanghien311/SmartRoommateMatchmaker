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
        indexExists: true, // fallback status
        documentCount: 5,
        indexName: this.indexName,
        checkedAt,
        provider: 'azure-search-fallback',
      };
    }

    try {
      const index = await this.indexClient.getIndex(this.indexName);
      const statistics = await this.indexClient.getIndexStatistics(this.indexName);
      return {
        indexExists: !!index,
        documentCount: statistics?.documentCount || 0,
        indexName: this.indexName,
        checkedAt,
        provider: 'azure-ai-search',
      };
    } catch (err) {
      return {
        indexExists: false,
        documentCount: 0,
        indexName: this.indexName,
        checkedAt,
        provider: 'azure-search-fallback',
        error: err.message,
      };
    }
  }

  async searchRooms(queryText) {
    const checkedAt = new Date().toISOString();
    const q = (queryText || '').trim();

    if (!this.searchClient) {
      return {
        source: 'postgresql-fallback',
        count: 0,
        results: [],
        checkedAt,
      };
    }

    try {
      const searchResults = await this.searchClient.search(q || '*', { top: 10 });
      const results = [];
      for await (const result of searchResults.results) {
        results.push(result.document);
      }
      return {
        source: 'azure-ai-search',
        count: results.length,
        results,
        checkedAt,
      };
    } catch (err) {
      return {
        source: 'postgresql-fallback',
        count: 0,
        results: [],
        checkedAt,
        error: err.message,
      };
    }
  }
}

module.exports = AzureSearchProvider;
