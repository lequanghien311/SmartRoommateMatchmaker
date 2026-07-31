import { state } from '../assets/js/utils/state.js';

const navItems = [
  ['/', 'Trang chủ'],
  ['/rooms', 'Tìm phòng'],
  ['/matches', 'Tìm bạn ở ghép'],
];

export function renderHeader(path = location.pathname) {
  const user = state.user;
  document.querySelector('#site-header').innerHTML = `<div class="site-header"><div class="container nav">
    <a href="/" class="brand" data-link aria-label="SmartRoomie - Trang chủ"><span class="brand-mark">S</span>SmartRoomie</a>
    <nav class="nav-links" id="main-nav" aria-label="Điều hướng chính">
      ${navItems.map(([href, label]) => `<a href="${href}" data-link ${path === href ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
      ${user?.role === 'landlord' ? '<a href="/landlord/rooms" data-link>Quản lý tin</a>' : ''}
      ${user?.role === 'admin' ? '<a href="/admin" data-link>Quản trị</a>' : ''}
    </nav>
    <div class="nav-actions">
      ${user ? `<a href="/notifications" class="button button-secondary button-icon notification-button" data-link aria-label="Thông báo">♢<span class="badge" id="notification-badge">0</span></a>
        <a href="/profile" class="button button-secondary" data-link>${user.role === 'admin' ? '🛡️ ' : user.role === 'landlord' ? '🏠 ' : '👤 '}${user.full_name || user.fullName || 'Hồ sơ'}</a>
        <button class="button button-small" data-logout>Đăng xuất</button>`
        : '<a href="/login" class="button button-secondary" data-link>Đăng nhập</a><a href="/register" class="button" data-link>Tham gia</a>'}
      <button class="menu-button" aria-label="Mở menu" aria-expanded="false">☰</button>
    </div>
  </div></div>`;
}

export function renderFooter() {
  document.querySelector('#site-footer').innerHTML = `<div class="site-footer"><div class="container">
    <div class="footer-grid"><div><a href="/" class="brand" data-link><span class="brand-mark">S</span>SmartRoomie</a>
      <p>Ở đúng nơi, gặp đúng người. Nền tảng tìm phòng và người ở ghép dành cho sinh viên Việt Nam.</p></div>
      <div><h3>Khám phá</h3><a href="/rooms" data-link>Phòng mới</a><a href="/matches" data-link>Ghép bạn ở</a><a href="/favorites" data-link>Đã lưu</a></div>
      <div><h3>Tài khoản</h3><a href="/profile" data-link>Hồ sơ</a><a href="/notifications" data-link>Thông báo</a><a href="/conversations" data-link>Trò chuyện</a></div>
      <div><h3>Hỗ trợ</h3><a href="/api/docs" target="_blank">API Docs</a><a href="/reports" data-link>Báo cáo tin</a><a href="mailto:hello@smartroommate.vn">Liên hệ</a></div>
    </div><div class="footer-bottom"><span>© 2026 SmartRoomie</span><span>Đồ án Điện toán đám mây · Made in Việt Nam</span></div>
  </div></div>`;
}

export const breadcrumb = (current) => `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/" data-link>Trang chủ</a><b>›</b><span>${current}</span></nav>`;

export function sidebar(active) {
  const role = state.user?.role;
  const items = role === 'admin'
    ? [['/admin', 'Tổng quan'], ['/admin/users', 'Người dùng'], ['/admin/rooms', 'Kiểm duyệt phòng'], ['/admin/reports', 'Báo cáo']]
    : role === 'landlord'
      ? [['/profile', 'Hồ sơ'], ['/landlord/rooms', 'Tin của tôi'], ['/rooms/new', 'Đăng phòng'], ['/conversations', 'Trò chuyện'], ['/notifications', 'Thông báo']]
      : [['/profile', 'Hồ sơ'], ['/favorites', 'Phòng yêu thích'], ['/roommate-profile', 'Hồ sơ ở ghép'], ['/matches', 'Bạn phù hợp'], ['/conversations', 'Trò chuyện'], ['/notifications', 'Thông báo']];
  return `<aside class="sidebar">${items.map(([href, label]) => `<a href="${href}" data-link class="${active === href ? 'active' : ''}">${label}<span>›</span></a>`).join('')}</aside>`;
}

