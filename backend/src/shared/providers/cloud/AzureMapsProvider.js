class AzureMapsProvider {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.AZURE_MAPS_KEY;
  }

  async geocode(addressQuery) {
    const checkedAt = new Date().toISOString();
    const query = (addressQuery || 'District 1, Ho Chi Minh City').slice(0, 150);

    if (!this.apiKey) {
      return {
        normalizedAddress: query + ', Vietnam',
        latitude: 10.7769,
        longitude: 106.7009,
        checkedAt,
        provider: 'azure-maps-fallback',
        fallbackUsed: true,
      };
    }

    try {
      const url = `https://atlas.microsoft.com/search/address/json?subscription-key=${encodeURIComponent(
        this.apiKey,
      )}&api-version=1.0&query=${encodeURIComponent(query)}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        throw new Error(`Azure Maps HTTP error ${response.status}`);
      }

      const data = await response.json();
      const first = data?.results?.[0];
      const position = first?.position || { lat: 10.7769, lon: 106.7009 };
      const normalizedAddress = first?.address?.freeformAddress || query;

      return {
        normalizedAddress,
        latitude: position.lat,
        longitude: position.lon,
        checkedAt,
        provider: 'azure-maps',
        httpStatus: response.status,
        fallbackUsed: false,
      };
    } catch (err) {
      return {
        normalizedAddress: query,
        latitude: 10.7769,
        longitude: 106.7009,
        checkedAt,
        provider: 'azure-maps-fallback',
        fallbackUsed: true,
        error: err.message,
      };
    }
  }
}

module.exports = AzureMapsProvider;
