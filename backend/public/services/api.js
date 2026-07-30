import { state } from '../assets/js/utils/state.js';

export class ApiError extends Error {
  constructor(message, status, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  let response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers });
  } catch (_error) {
    throw new ApiError('Không thể kết nối máy chủ. Vui lòng kiểm tra lại kết nối.', 0);
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({ message: 'Phản hồi máy chủ không hợp lệ' }));
  if (!response.ok) {
    if (response.status === 401 && state.session) state.clearSession();
    throw new ApiError(payload.message || 'Thao tác không thành công', response.status, payload.errors);
  }
  return payload;
}

