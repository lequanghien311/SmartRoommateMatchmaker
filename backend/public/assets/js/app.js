import { state } from './utils/state.js';
import { toast } from './utils/ui.js';
import { authService } from '../../services/auth.service.js';
import { roomService } from '../../services/room.service.js';
import { chatService } from '../../services/chat.service.js';
import { notificationService } from '../../services/notification.service.js';
import { renderHeader, renderFooter } from '../../components/layout.js';
import * as views from '../../pages/views.js';

const routes = [
  [/^\/$/, () => views.home()],
  [/^\/login$/, () => views.login()],
  [/^\/register$/, () => views.register()],
  [/^\/rooms$/, () => views.rooms()],
  [/^\/rooms\/new$/, () => views.roomForm()],
  [/^\/rooms\/([0-9a-f-]+)$/, (match) => views.roomDetail(match[1])],
  [/^\/landlord\/rooms$/, () => views.landlordRooms()],
  [/^\/favorites$/, () => views.favorites()],
  [/^\/profile$/, () => views.profile()],
  [/^\/roommate-profile$/, () => views.roommateProfile()],
  [/^\/matches$/, () => views.matches()],
  [/^\/matches\/([0-9a-f-]+)$/, (match) => views.matchDetail(match[1])],
  [/^\/conversations$/, () => views.conversations()],
  [/^\/conversations\/([0-9a-f-]+)$/, (match) => views.conversations(match[1])],
  [/^\/notifications$/, () => views.notifications()],
  [/^\/reports$/, () => views.reports()],
  [/^\/admin$/, () => views.adminDashboard()],
  [/^\/admin\/users$/, () => views.adminUsers()],
  [/^\/admin\/rooms$/, () => views.adminRooms()],
  [/^\/admin\/reports$/, () => views.adminReports()],
];

async function router() {
  renderHeader(location.pathname);
  renderFooter();
  window.scrollTo({ top: 0, behavior: 'instant' });
  const route = routes.find(([pattern]) => pattern.test(location.pathname));
  if (!route) return views.notFound();
  const match = location.pathname.match(route[0]);
  try {
    await route[1](match);
  } catch (error) {
    console.error(error);
    views.notFound();
  }
  document.querySelector('#main-content').focus({ preventScroll: true });
  updateBadge();
}

async function updateBadge() {
  if (!state.user) return;
  try {
    const result = await notificationService.unread();
    const badge = document.querySelector('#notification-badge');
    if (badge) {
      badge.textContent = result.data.count;
      badge.hidden = !result.data.count;
    }
  } catch (_error) {
    // Badge là thông tin bổ sung; trang chính vẫn hoạt động khi endpoint tạm lỗi.
  }
}

document.addEventListener('click', async (event) => {
  const link = event.target.closest('[data-link]');
  if (link && link.origin === location.origin) {
    event.preventDefault();
    history.pushState({}, '', link.href);
    router();
    return;
  }
  const menu = event.target.closest('.menu-button');
  if (menu) {
    const nav = document.querySelector('#main-nav');
    nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', nav.classList.contains('open'));
  }
  if (event.target.closest('[data-logout]')) {
    chatService.disconnect();
    await authService.logout();
    toast('Đã đăng xuất');
    history.pushState({}, '', '/');
    router();
  }
  const favorite = event.target.closest('[data-favorite]');
  if (favorite) {
    if (!state.user) {
      history.pushState({}, '', '/login');
      return router();
    }
    try {
      await roomService.favorite(favorite.dataset.favorite);
      favorite.textContent = '♥';
      toast('Đã lưu phòng yêu thích');
    } catch (error) {
      toast(error.message, error.status === 409 ? 'success' : 'error');
    }
  }
  const chat = event.target.closest('[data-chat-owner]');
  if (chat) {
    if (!state.user) {
      history.pushState({}, '', '/login');
      return router();
    }
    try {
      const result = await chatService.create({ memberId: chat.dataset.chatOwner });
      history.pushState({}, '', `/conversations/${result.data.id}`);
      router();
    } catch (error) {
      toast(error.message, 'error');
    }
  }
  if (event.target.closest('[data-reload]')) router();
  if (event.target.closest('[data-link-back]')) history.back();
});

window.addEventListener('popstate', router);
window.addEventListener('session:changed', () => renderHeader(location.pathname));
router();
