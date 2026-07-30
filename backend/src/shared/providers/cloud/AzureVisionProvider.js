class AzureVisionProvider {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint || process.env.AZURE_VISION_ENDPOINT || 'https://cog-vision-smartroommate-84573.cognitiveservices.azure.com/';
    this.apiKey = apiKey || process.env.AZURE_VISION_KEY;
  }

  async analyzeImage(imageUrl) {
    const checkedAt = new Date().toISOString();
    const defaultUrl = 'https://stsmartroommateea.blob.core.windows.net/room-images/demo-room.jpg';
    const targetUrl = imageUrl && (imageUrl.startsWith('https://stsmartroommateea.blob.core.windows.net/') || imageUrl.startsWith('https://images.unsplash.com/')) ? imageUrl : defaultUrl;

    if (!this.apiKey) {
      return {
        caption: 'Mô phỏng: Căn phòng ngủ sáng sủa với cửa sổ lớn và nội thất gỗ.',
        tags: ['room', 'bedroom', 'furniture', 'interior'],
        detectedText: 'Smart Roommate Demo',
        imageUrl: targetUrl,
        checkedAt,
        provider: 'azure-vision-fallback',
      };
    }

    try {
      const url = `${this.endpoint.replace(/\/$/, '')}/vision/v3.2/analyze?visualFeatures=Categories,Description,Tags`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: JSON.stringify({ url: targetUrl }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Azure Vision HTTP error ${response.status}`);
      }

      const data = await response.json();
      const caption = data.description?.captions?.[0]?.text || 'Phòng cho thuê sạch đẹp, hiện đại';
      const tags = (data.tags || []).slice(0, 8).map((t) => t.name);

      return {
        caption,
        tags,
        detectedText: 'Room Preview',
        imageUrl: targetUrl,
        checkedAt,
        provider: 'azure-ai-vision',
      };
    } catch (err) {
      return {
        caption: 'Căn phòng rộng rãi, đầy đủ tiện nghi sinh hoạt.',
        tags: ['room', 'clean', 'modern'],
        detectedText: '',
        imageUrl: targetUrl,
        checkedAt,
        provider: 'azure-vision-fallback',
        error: err.message,
      };
    }
  }
}

module.exports = AzureVisionProvider;
