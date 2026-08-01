import { api, ApiError } from './api.js';
export const roomService = {
  search: async (params = new URLSearchParams()) => {
    const keyword = params.get('keyword');
    if (keyword) {
      try {
        const res = await api(`/cloud/search/rooms?q=${encodeURIComponent(keyword)}`);
        if (res.results && res.fallbackUsed === false && res.results.length > 0) {
          return {
            data: res.results,
            meta: { total: res.resultCount, page: 1, totalPages: 1 },
          };
        }
      } catch (_) { /* fallback */ }
    }
    return api(`/rooms?${params}`);
  },
  detail: (id) => api(`/rooms/${id}`),
  manage: (id) => api(`/rooms/${id}/manage`),
  mine: () => api('/rooms/mine'),
  create: (input) => api('/rooms', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => api(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  transition: (id, status, reason) => api(`/rooms/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  uploadImages: (id, images) => {
    const body = new FormData();
    [...images].forEach((image) => body.append('images', image));
    return api(`/media/rooms/${id}/images`, { method: 'POST', body });
  },
  analyzeImage: (imageId) => api(`/media/images/${imageId}/vision`),
  geocode: (input) => api('/rooms/geocode', { method: 'POST', body: JSON.stringify(input) }),
  translate: (id) => api(`/rooms/${id}/translation?targetLanguage=en`),
  language: (id) => api(`/rooms/${id}/language`),
  speech: async (id) => {
    const response = await fetch(`/api/rooms/${id}/speech`);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new ApiError(payload.message || 'Không thể tạo âm thanh', response.status, payload.errors || []);
    }
    return {
      blob: await response.blob(),
      provider: response.headers.get('X-Azure-Provider'),
      fallbackUsed: response.headers.get('X-Azure-Fallback-Used') !== 'false',
      contentType: response.headers.get('Content-Type'),
    };
  },
  amenities: () => api('/amenities'),
  favorites: () => api('/favorites'),
  favorite: (id) => api(`/favorites/${id}`, { method: 'POST' }),
  unfavorite: (id) => api(`/favorites/${id}`, { method: 'DELETE' }),
};

