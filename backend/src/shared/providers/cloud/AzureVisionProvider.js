class AzureVisionProvider {
  constructor(endpoint, apiKey) {
    const rawEndpoint = endpoint || process.env.AZURE_VISION_ENDPOINT || 'https://cog-vision-smartroommate-84573.cognitiveservices.azure.com/';
    this.endpoint = rawEndpoint.replace(/\/+$/, '').replace(/\/vision\/v3\.2$/, '');
    this.apiKey = apiKey || process.env.AZURE_VISION_KEY;
  }

  async analyzeImageBuffer(imageBuffer, mimeType = 'image/jpeg', blobName = 'demo-room.jpg') {
    const checkedAt = new Date().toISOString();

    if (!Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      return {
        provider: 'azure-vision-fallback',
        caption: 'Mô phỏng: Dữ liệu ảnh không hợp lệ.',
        tags: ['room', 'clean'],
        fallbackUsed: true,
        error: 'Buffer ảnh rỗng hoặc không hợp lệ',
        checkedAt,
      };
    }

    if (imageBuffer.length > 4 * 1024 * 1024) {
      return {
        provider: 'azure-vision-fallback',
        caption: 'Mô phỏng: Dung lượng ảnh vượt quá giới hạn 4MB.',
        tags: ['room', 'clean'],
        fallbackUsed: true,
        error: 'Kích thước buffer vượt quá 4MB',
        checkedAt,
      };
    }

    const allowedMimes = ['image/jpeg', 'image/png'];
    const safeMime = allowedMimes.includes(mimeType) ? mimeType : 'image/jpeg';

    if (!this.apiKey) {
      return {
        provider: 'azure-vision-fallback',
        caption: 'Mô phỏng: Căn phòng ngủ sáng sủa với cửa sổ lớn và nội thất gỗ.',
        tags: ['room', 'bedroom', 'furniture', 'interior'],
        fallbackUsed: true,
        error: 'Thiếu AZURE_VISION_KEY',
        checkedAt,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `${this.endpoint}/vision/v3.2/analyze?visualFeatures=Description,Tags`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: imageBuffer,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Azure Vision API HTTP ${response.status}`);
      }

      const data = await response.json();
      const caption = data.description?.captions?.[0]?.text || 'Phòng trọ tiện nghi, ánh sáng tốt';
      const tags = (data.tags || []).slice(0, 8).map((t) => t.name);
      const requestId = response.headers.get('apim-request-id') || response.headers.get('x-ms-request-id') || `vis-${Date.now()}`;

      return {
        provider: 'azure-ai-vision',
        apiVersion: 'v3.2',
        blobName,
        imageContentType: safeMime,
        imageSizeBytes: imageBuffer.length,
        httpStatus: response.status,
        requestId,
        caption,
        tags,
        fallbackUsed: false,
        checkedAt,
      };
    } catch (err) {
      const sanitizedMsg = (err.message || '').replace(new RegExp(this.apiKey, 'g'), '[REDACTED]');
      return {
        provider: 'azure-vision-fallback',
        caption: 'Mô phỏng: Căn phòng rộng rãi, đầy đủ tiện nghi sinh hoạt.',
        tags: ['room', 'clean', 'modern'],
        fallbackUsed: true,
        error: sanitizedMsg,
        checkedAt,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  async analyzeImageUrl(imageUrl) {
    const checkedAt = new Date().toISOString();
    const defaultUrl = 'https://stsmartroommateea.blob.core.windows.net/room-images/demo-room.jpg';
    const targetUrl =
      imageUrl &&
      (imageUrl.startsWith('https://stsmartroommateea.blob.core.windows.net/') ||
        imageUrl.startsWith('https://images.unsplash.com/'))
        ? imageUrl
        : defaultUrl;

    if (!this.apiKey) {
      return {
        caption: 'Mô phỏng: Căn phòng ngủ sáng sủa với cửa sổ lớn và nội thất gỗ.',
        tags: ['room', 'bedroom', 'furniture', 'interior'],
        fallbackUsed: true,
        checkedAt,
        provider: 'azure-vision-fallback',
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    try {
      const url = `${this.endpoint}/vision/v3.2/analyze?visualFeatures=Description,Tags`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
        body: JSON.stringify({ url: targetUrl }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Azure Vision HTTP error ${response.status}`);
      }

      const data = await response.json();
      const caption = data.description?.captions?.[0]?.text || 'Phòng cho thuê sạch đẹp, hiện đại';
      const tags = (data.tags || []).slice(0, 8).map((t) => t.name);

      return {
        provider: 'azure-ai-vision',
        apiVersion: 'v3.2',
        imageUrl: targetUrl,
        httpStatus: response.status,
        requestId: response.headers.get('apim-request-id') || `vis-${Date.now()}`,
        caption,
        tags,
        fallbackUsed: false,
        checkedAt,
      };
    } catch (err) {
      const sanitizedMsg = (err.message || '').replace(new RegExp(this.apiKey, 'g'), '[REDACTED]');
      return {
        provider: 'azure-vision-fallback',
        caption: 'Căn phòng rộng rãi, đầy đủ tiện nghi sinh hoạt.',
        tags: ['room', 'clean', 'modern'],
        fallbackUsed: true,
        error: sanitizedMsg,
        checkedAt,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

module.exports = AzureVisionProvider;
