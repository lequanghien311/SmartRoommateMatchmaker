export const money = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
export const date = (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value));
export const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);

export function toast(message, type = 'success') {
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.textContent = message;
  document.querySelector('#toast-region').append(element);
  setTimeout(() => element.remove(), 3500);
}

export function loadingCards(count = 6) {
  return `<div class="room-grid">${Array.from({ length: count }, () => `
    <div class="room-card"><div class="room-media skeleton"></div><div class="room-body">
    <div class="skeleton" style="height:18px;width:70%;margin-bottom:12px"></div>
    <div class="skeleton" style="height:14px;width:100%;margin-bottom:18px"></div>
    <div class="skeleton" style="height:24px;width:45%"></div></div></div>`).join('')}</div>`;
}

export function emptyState(title, description, action = '') {
  return `<div class="empty"><div><div class="empty-icon">⌂</div><h3>${escapeHtml(title)}</h3><p class="muted">${escapeHtml(description)}</p>${action}</div></div>`;
}

export function errorState(message) {
  return `<div class="error-state"><div><div class="empty-icon">!</div><h3>Đã có sự cố</h3><p class="muted">${escapeHtml(message)}</p><button class="button" data-reload>Thử lại</button></div></div>`;
}

export function confirmDialog({ title, message, confirmText = 'Xác nhận', danger = false }) {
  return new Promise((resolve) => {
    const root = document.querySelector('#modal-root');
    root.innerHTML = `<div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal"><h3 id="modal-title">${escapeHtml(title)}</h3><p class="muted">${escapeHtml(message)}</p>
      <div class="modal-actions"><button class="button button-secondary" data-modal-cancel>Hủy</button>
      <button class="button ${danger ? 'button-danger' : ''}" data-modal-confirm>${escapeHtml(confirmText)}</button></div></div></div>`;
    const finish = (value) => { root.innerHTML = ''; resolve(value); };
    root.querySelector('[data-modal-cancel]').onclick = () => finish(false);
    root.querySelector('[data-modal-confirm]').onclick = () => finish(true);
    root.querySelector('.modal-backdrop').onclick = (event) => { if (event.target === event.currentTarget) finish(false); };
    root.querySelector('[data-modal-confirm]').focus();
  });
}

export function roomCard(room) {
  const image = room.images?.find((item) => item.isCover || item.is_cover) || room.images?.[0];
  return `<article class="room-card">
    <div class="room-media">${image ? `<img src="${escapeHtml(image.url)}" alt="${escapeHtml(room.title)}" />` : '<div class="room-placeholder">Không gian mới</div>'}
      <button class="favorite" data-favorite="${room.id}" aria-label="Lưu phòng yêu thích">♡</button>
      ${room.status && room.status !== 'active' ? `<span class="room-status">${escapeHtml(room.status)}</span>` : ''}
    </div>
    <div class="room-body"><div class="room-meta"><span>⌖ ${escapeHtml(room.district)}</span><span>□ ${room.area} m²</span><span>◎ ${room.max_occupants || room.maxOccupants} người</span></div>
    <h3><a href="/rooms/${room.id}" data-link>${escapeHtml(room.title)}</a></h3>
    <p class="muted">${escapeHtml(room.description).slice(0, 92)}…</p>
    <div class="price-row"><span class="price">${money(room.monthly_price || room.monthlyPrice)}đ <small>/ tháng</small></span>
    <span class="pill">${room.room_type || room.roomType}</span></div></div>
  </article>`;
}

