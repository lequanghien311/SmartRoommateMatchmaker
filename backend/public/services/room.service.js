import { api } from './api.js';
export const roomService = {
  search: async (params = new URLSearchParams()) => {
    const keyword = params.get('keyword');
    if (keyword) {
      try {
        const res = await api(`/cloud/search/rooms?q=${encodeURIComponent(keyword)}`);
        if (res.results && res.fallbackUsed === false && res.results.length > 0) {
          return {
            data: res.results.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              monthly_price: item.price || item.monthly_price,
              district: item.address || item.district || 'Hồ Chí Minh',
              area: item.area || 20,
              max_occupants: item.max_occupants || 2,
              room_type: item.room_type || 'private',
              '@search.score': item['@search.score'],
            })),
            meta: { total: res.resultCount, page: 1, totalPages: 1 },
          };
        }
      } catch (_) { /* fallback */ }
    }
    return api(`/rooms?${params}`);
  },
  detail: (id) => api(`/rooms/${id}`),
  mine: () => api('/rooms/mine'),
  create: (input) => api('/rooms', { method: 'POST', body: JSON.stringify(input) }),
  update: (id, input) => api(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  transition: (id, status, reason) => api(`/rooms/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) }),
  amenities: () => api('/amenities'),
  favorites: () => api('/favorites'),
  favorite: (id) => api(`/favorites/${id}`, { method: 'POST' }),
  unfavorite: (id) => api(`/favorites/${id}`, { method: 'DELETE' }),
};

