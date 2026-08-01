import { state } from '../assets/js/utils/state.js';
import { authService } from '../services/auth.service.js';
import { roomService } from '../services/room.service.js';
import { matchingService } from '../services/matching.service.js';
import { chatService } from '../services/chat.service.js';
import { notificationService } from '../services/notification.service.js';
import { adminService } from '../services/admin.service.js';
import { reportService } from '../services/report.service.js';
import { breadcrumb, sidebar } from '../components/layout.js';
import { money, date, escapeHtml, toast, loadingCards, emptyState, errorState, confirmDialog, roomCard } from '../assets/js/utils/ui.js';

const main = () => document.querySelector('#main-content');
const requireAuth = () => {
  if (state.user) return true;
  history.replaceState({}, '', '/login');
  window.dispatchEvent(new PopStateEvent('popstate'));
  return false;
};
const requireRole = (role) => requireAuth() && state.user.role === role;
const pageShell = (title, subtitle = '') => `<section class="page-hero"><div class="container">${breadcrumb(title)}<h1>${title}</h1>${subtitle ? `<p class="muted">${subtitle}</p>` : ''}</div></section>`;

export async function home() {
  main().innerHTML = `<section class="hero"><div class="container hero-grid"><div class="hero-copy">
    <span class="eyebrow">Tìm trọ thông minh cho sinh viên</span>
    <h1>Ở đúng nơi.<br />Gặp <em>đúng người.</em></h1>
    <p>Không chỉ tìm một căn phòng — hãy tìm một nơi vừa túi tiền, gần trường và một người ở cùng hợp nếp sống.</p>
    <form class="search-panel" id="hero-search"><input name="keyword" aria-label="Từ khóa" placeholder="Tên đường, khu vực, trường học…" />
      <select name="district" aria-label="Quận huyện"><option value="">Mọi khu vực</option><option>Bình Thạnh</option><option>Gò Vấp</option><option>Thủ Đức</option><option>Quận 7</option></select>
      <button class="button button-accent">Tìm phòng →</button></form>
  </div><div class="hero-art" aria-hidden="true"><div class="room-shape"></div><div class="floating-stat stat-one"><strong>92%</strong>độ phù hợp</div><div class="floating-stat stat-two"><strong>20+</strong>phòng mới</div></div></div></section>
  <section class="stats-strip"><div class="container stats-grid"><div class="stat"><strong>20+</strong>phòng đã xác minh</div><div class="stat"><strong>8</strong>hồ sơ ở ghép</div><div class="stat"><strong>100</strong>điểm tương thích</div><div class="stat"><strong>24/7</strong>chat trực tiếp</div></div></section>
  <section class="section"><div class="container"><div class="section-heading"><div><span class="eyebrow">Được quan tâm</span><h2>Phòng mới dành cho bạn</h2></div><a class="text-link" href="/rooms" data-link>Xem tất cả →</a></div><div id="featured">${loadingCards(3)}</div></div></section>
  <section class="section" style="background:#eaf0ea"><div class="container"><div class="section-heading"><div><span class="eyebrow">Một nền tảng, hai bài toán</span><h2>Tìm dễ hơn. Sống hợp hơn.</h2></div></div><div class="feature-grid">
    <article class="feature"><div class="feature-icon">⌂</div><h3>Bộ lọc sát nhu cầu</h3><p class="muted">Giá, diện tích, khu vực, tiện ích và chính sách thú cưng được giữ ngay trên URL.</p></article>
    <article class="feature"><div class="feature-icon">◎</div><h3>Ghép theo lối sống</h3><p class="muted">10 tiêu chí minh bạch, có điểm chi tiết, điểm chung và cảnh báo xung đột.</p></article>
    <article class="feature"><div class="feature-icon">↗</div><h3>Kết nối tức thì</h3><p class="muted">Chat thời gian thực, thông báo chưa đọc và lịch sử hội thoại an toàn.</p></article>
  </div></div></section>`;
  document.querySelector('#hero-search').onsubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(new FormData(event.currentTarget));
    history.pushState({}, '', `/rooms?${params}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  try {
    const result = await roomService.search(new URLSearchParams('limit=3&sort=popular'));
    document.querySelector('#featured').innerHTML = result.data.length ? `<div class="room-grid">${result.data.map(roomCard).join('')}</div>` : emptyState('Chưa có phòng nổi bật', 'Hãy quay lại sau khi chủ trọ đăng tin.');
  } catch (error) {
    document.querySelector('#featured').innerHTML = errorState(error.message);
  }
}

export async function rooms() {
  const params = new URLSearchParams(location.search);
  main().innerHTML = `${pageShell('Tìm phòng trọ', 'Lọc nhanh theo nơi bạn muốn sống và ngân sách hiện có.')}
  <section class="container section-tight"><form class="panel filters" id="room-filters">
    <div class="field"><label>Từ khóa</label><input name="keyword" value="${escapeHtml(params.get('keyword') || '')}" placeholder="Đường, trường, tên phòng…" /></div>
    <div class="field"><label>Giá từ</label><input type="number" name="minPrice" value="${params.get('minPrice') || ''}" placeholder="2.000.000" /></div>
    <div class="field"><label>Giá đến</label><input type="number" name="maxPrice" value="${params.get('maxPrice') || ''}" placeholder="5.000.000" /></div>
    <div class="field"><label>Sắp xếp</label><select name="sort"><option value="newest">Mới nhất</option><option value="price_asc">Giá tăng dần</option><option value="price_desc">Giá giảm dần</option><option value="popular">Phổ biến</option></select></div>
    <button class="button">Áp dụng</button></form><div id="room-results">${loadingCards()}</div></section>`;
  document.querySelector('[name="sort"]').value = params.get('sort') || 'newest';
  document.querySelector('#room-filters').onsubmit = (event) => {
    event.preventDefault();
    const next = new URLSearchParams(new FormData(event.currentTarget));
    [...next.entries()].forEach(([key, value]) => { if (!value) next.delete(key); });
    history.pushState({}, '', `/rooms?${next}`);
    rooms();
  };
  try {
    const result = await roomService.search(params);
    const pagination = result.meta;
    document.querySelector('#room-results').innerHTML = result.data.length
      ? `<div class="room-grid">${result.data.map(roomCard).join('')}</div>
        <div class="pagination">${Array.from({ length: pagination.totalPages }, (_, index) => `<button data-page="${index + 1}" class="${pagination.page === index + 1 ? 'active' : ''}">${index + 1}</button>`).join('')}</div>`
      : emptyState('Không tìm thấy phòng phù hợp', 'Hãy thử nới khoảng giá hoặc bỏ bớt bộ lọc.');
    document.querySelectorAll('[data-page]').forEach((button) => button.onclick = () => { params.set('page', button.dataset.page); history.pushState({}, '', `/rooms?${params}`); rooms(); });
  } catch (error) {
    document.querySelector('#room-results').innerHTML = errorState(error.message);
  }
}

export async function roomDetail(id) {
  main().innerHTML = `${pageShell('Chi tiết phòng')}<section class="container"><div id="room-detail" class="page-loading"><span class="spinner"></span></div></section>`;
  try {
    const { data: room } = await roomService.detail(id);
    const images = room.images || [];
    const gallery = Array.from({ length: 3 }, (_, index) => images[index]
      ? `<div><img src="${escapeHtml(images[index].url)}" alt="${escapeHtml(room.title)} - ảnh ${index + 1}" /></div>`
      : '<div class="room-placeholder">SmartRoomie</div>').join('');
    document.querySelector('#room-detail').className = 'detail-grid';
    document.querySelector('#room-detail').innerHTML = `<div><div class="gallery">${gallery}</div><article class="panel detail-panel">
      <span class="eyebrow">${escapeHtml(room.room_type)}</span><h2>${escapeHtml(room.title)}</h2>
      <div class="room-meta"><span>⌖ ${escapeHtml(room.address)}, ${escapeHtml(room.district)}</span><span>□ ${room.area} m²</span><span>◎ ${room.max_occupants} người</span></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:24px 0" /><h3>Mô tả</h3><p id="room-description">${escapeHtml(room.description)}</p>
      <div class="azure-actions">
        <button class="button button-secondary button-small" data-translate-room>Dịch sang tiếng Anh</button>
        <button class="button button-secondary button-small" data-original-room hidden>Xem bản gốc</button>
        <button class="button button-secondary button-small" data-speech-room>Nghe mô tả</button>
      </div>
      <audio id="room-audio" controls hidden></audio>
      <div id="translation-evidence"></div>
      <div id="language-evidence" class="azure-evidence" style="margin-top:16px"><strong>Azure AI Language</strong><span>Đang phân tích mô tả hiện tại…</span></div>
      <h3>Tiện ích</h3><ul class="amenity-list">${(room.amenities || []).map((item) => `<li>✓ ${escapeHtml(item.name)}</li>`).join('') || '<li>Đang cập nhật</li>'}</ul>
    </article></div><aside><div class="panel detail-panel sticky-panel"><span class="eyebrow">Giá thuê hàng tháng</span>
      <h2 style="color:var(--forest);margin:8px 0">${money(room.monthly_price)}đ</h2><p class="muted">Cọc ${money(room.deposit)}đ · Còn ${room.available_rooms} phòng</p>
      <button class="button" style="width:100%;margin-bottom:10px" data-chat-owner="${room.landlord_id}">Trò chuyện với chủ trọ</button>
      <button class="button button-secondary" style="width:100%;margin-bottom:10px" data-favorite="${room.id}">♡ Lưu phòng</button>
      <a class="button button-secondary" style="width:100%" href="/reports?roomId=${room.id}" data-link>⚑ Báo cáo tin</a>
      <hr style="border:0;border-top:1px solid var(--line);margin:24px 0" /><h3>${escapeHtml(room.landlord.fullName)}</h3><p class="muted">Chủ trọ trên SmartRoomie</p>
    </div></aside>`;
    const description = document.querySelector('#room-description');
    const translateButton = document.querySelector('[data-translate-room]');
    const originalButton = document.querySelector('[data-original-room]');
    translateButton.onclick = async () => {
      translateButton.disabled = true;
      translateButton.textContent = 'Đang dịch bằng Azure…';
      try {
        const { data } = await roomService.translate(id);
        if (data.provider !== 'azure-translator' || data.fallbackUsed !== false) throw new Error('Translator đã dùng fallback');
        description.textContent = data.translatedText;
        originalButton.hidden = false;
        document.querySelector('#translation-evidence').innerHTML = `<div class="azure-evidence verified"><strong>Azure Translator verified</strong><span>provider=${escapeHtml(data.provider)} · fallbackUsed=false · ${escapeHtml(data.sourceLanguage)}→${escapeHtml(data.targetLanguage)}</span></div>`;
      } catch (error) { toast(error.message, 'error'); }
      finally { translateButton.disabled = false; translateButton.textContent = 'Dịch sang tiếng Anh'; }
    };
    originalButton.onclick = () => {
      description.textContent = room.description;
      originalButton.hidden = true;
    };
    document.querySelector('[data-speech-room]').onclick = async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Đang tạo audio Azure…';
      try {
        const audioResult = await roomService.speech(id);
        if (audioResult.provider !== 'azure-ai-speech' || audioResult.fallbackUsed || !audioResult.contentType?.startsWith('audio/mpeg')) {
          throw new Error('Azure Speech không trả audio/mpeg hợp lệ');
        }
        const audio = document.querySelector('#room-audio');
        if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl);
        const objectUrl = URL.createObjectURL(audioResult.blob);
        audio.dataset.objectUrl = objectUrl;
        audio.src = objectUrl;
        audio.hidden = false;
        await audio.play();
        button.textContent = 'Phát lại mô tả';
      } catch (error) {
        toast(error.message, 'error');
        button.textContent = 'Nghe mô tả';
      } finally { button.disabled = false; }
    };
    try {
      const { data } = await roomService.language(id);
      const verified = data.provider === 'azure-ai-language' && data.fallbackUsed === false;
      document.querySelector('#language-evidence').className = `azure-evidence ${verified ? 'verified' : 'failed'}`;
      document.querySelector('#language-evidence').innerHTML = `<strong>Azure AI Language ${verified ? 'verified' : 'không khả dụng'}</strong>
        <span>provider=${escapeHtml(data.provider)} · fallbackUsed=${String(data.fallbackUsed)} · sentiment=${escapeHtml(data.sentiment)} · confidence=${Number(data.confidence).toFixed(2)}</span>
        <div class="tag-list">${(data.keyPhrases || []).map((phrase) => `<span class="pill">${escapeHtml(phrase)}</span>`).join('')}</div>`;
    } catch (error) {
      document.querySelector('#language-evidence').className = 'azure-evidence failed';
      document.querySelector('#language-evidence').innerHTML = `<strong>Azure AI Language không khả dụng</strong><span>${escapeHtml(error.message)}</span>`;
    }
  } catch (error) {
    document.querySelector('#room-detail').className = '';
    document.querySelector('#room-detail').innerHTML = errorState(error.message);
  }
}

function authView(kind) {
  const login = kind === 'login';
  main().innerHTML = `<section class="auth-shell"><div class="auth-visual"><div><span class="eyebrow" style="color:var(--lime)">SmartRoomie</span><h1>${login ? 'Chào mừng bạn trở lại.' : 'Bắt đầu một chỗ ở mới.'}</h1><p>${login ? 'Những căn phòng và người bạn phù hợp đang chờ.' : 'Tạo hồ sơ trong chưa đầy hai phút.'}</p></div></div>
  <div class="auth-form-wrap"><div class="auth-card"><span class="eyebrow">${login ? 'Đăng nhập' : 'Tạo tài khoản'}</span><h2>${login ? 'Tiếp tục hành trình' : 'Tham gia SmartRoomie'}</h2>
  ${login ? `<div class="demo-box">
    <div class="demo-box-header">⚡ Đăng nhập nhanh Demo (Mật khẩu: Demo@123)</div>
    <div class="demo-roles-grid">
      <button type="button" class="demo-role-btn" data-demo-email="tenant1@smartroommate.vn" title="Đăng nhập người thuê 1">
        <span class="role-icon">👤</span>
        <div class="role-info"><strong>Người thuê 1</strong><small>tenant1@smartroommate.vn</small></div>
      </button>
      <button type="button" class="demo-role-btn" data-demo-email="tenant2@smartroommate.vn" title="Đăng nhập người thuê 2">
        <span class="role-icon">👤</span>
        <div class="role-info"><strong>Người thuê 2</strong><small>tenant2@smartroommate.vn</small></div>
      </button>
      <button type="button" class="demo-role-btn" data-demo-email="landlord1@smartroommate.vn" title="Đăng nhập chủ trọ">
        <span class="role-icon">🏠</span>
        <div class="role-info"><strong>Chủ trọ</strong><small>landlord1@smartroommate.vn</small></div>
      </button>
      <button type="button" class="demo-role-btn" data-demo-email="admin@smartroommate.vn" title="Đăng nhập quản trị viên">
        <span class="role-icon">🛡️</span>
        <div class="role-info"><strong>Quản trị</strong><small>admin@smartroommate.vn</small></div>
      </button>
    </div>
  </div>` : ''}
  <form id="auth-form">${login ? '' : `<div class="field"><label>Họ và tên</label><input name="fullName" required minlength="2" /></div><div class="field"><label>Số điện thoại</label><input name="phone" required pattern="0[0-9]{9}" /></div>
    <div class="field"><label>Vai trò</label><select name="role"><option value="tenant">Người thuê</option><option value="landlord">Chủ trọ</option></select></div>`}
    <div class="field"><label>Email</label><input name="email" type="email" required /></div>
    <div class="field"><label>Mật khẩu</label><input name="password" type="password" required minlength="8" pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}" /></div>
    <button class="button">${login ? 'Đăng nhập →' : 'Tạo tài khoản →'}</button>
    <p class="muted">${login ? 'Chưa có tài khoản? <a class="text-link" href="/register" data-link>Đăng ký</a>' : 'Đã có tài khoản? <a class="text-link" href="/login" data-link>Đăng nhập</a>'}</p></form></div></div></section>`;
  if (login) {
    document.querySelectorAll('.demo-role-btn').forEach((button) => {
      button.onclick = () => {
        const form = document.querySelector('#auth-form');
        form.elements.email.value = button.dataset.demoEmail;
        form.elements.password.value = 'Demo@123';
        form.requestSubmit();
      };
    });
  }
  document.querySelector('#auth-form').onsubmit = async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    button.disabled = true; button.textContent = 'Đang xử lý…';
    try {
      const input = Object.fromEntries(new FormData(event.currentTarget));
      if (login) await authService.login(input.email, input.password);
      else await authService.register(input);
      toast(login ? 'Đăng nhập thành công' : 'Chào mừng bạn đến SmartRoomie');
      history.replaceState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      toast(error.message, 'error');
      button.disabled = false; button.textContent = login ? 'Đăng nhập →' : 'Tạo tài khoản →';
    }
  };
}
export const login = () => authView('login');
export const register = () => authView('register');

export async function profile() {
  if (!requireAuth()) return;
  main().innerHTML = `${pageShell('Hồ sơ cá nhân')}<section class="container layout-sidebar">${sidebar('/profile')}<div class="panel detail-panel" id="profile-panel"><div class="page-loading"><span class="spinner"></span></div></div></section>`;
  try {
    const { data: user } = await authService.me();
    document.querySelector('#profile-panel').innerHTML = `<div class="match-head"><div class="avatar">${escapeHtml(user.full_name).charAt(0)}</div><div><h2 style="margin:0">${escapeHtml(user.full_name)}</h2><p class="muted">${escapeHtml(user.email)} · ${user.role}</p></div></div>
    <form class="form-grid" id="profile-form" style="margin-top:28px"><div class="field"><label>Họ tên</label><input name="fullName" value="${escapeHtml(user.full_name)}" required /></div>
    <div class="field"><label>Số điện thoại</label><input name="phone" value="${escapeHtml(user.phone || '')}" /></div><div class="field"><label>Ngày sinh</label><input type="date" name="birthDate" value="${user.birth_date?.slice(0,10) || ''}" /></div>
    <div class="field"><label>Giới tính</label><select name="gender"><option value="">Chưa chọn</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></div>
    <div class="field field-full"><label>Trường học</label><input name="school" value="${escapeHtml(user.school || '')}" /></div><div class="field field-full"><label>Giới thiệu</label><textarea name="bio">${escapeHtml(user.bio || '')}</textarea></div>
    <div class="form-actions"><button class="button">Lưu thay đổi</button></div></form>`;
    document.querySelector('[name="gender"]').value = user.gender || '';
    document.querySelector('#profile-form').onsubmit = async (event) => {
      event.preventDefault();
      try { await authService.update(Object.fromEntries(new FormData(event.currentTarget))); toast('Đã cập nhật hồ sơ'); } catch (error) { toast(error.message, 'error'); }
    };
  } catch (error) { document.querySelector('#profile-panel').innerHTML = errorState(error.message); }
}

export async function favorites() {
  if (!requireRole('tenant')) return;
  main().innerHTML = `${pageShell('Phòng yêu thích')}<section class="container layout-sidebar">${sidebar('/favorites')}<div id="favorite-list">${loadingCards(4)}</div></section>`;
  try {
    const result = await roomService.favorites();
    document.querySelector('#favorite-list').innerHTML = result.data.length ? `<div class="room-grid">${result.data.map(roomCard).join('')}</div>` : emptyState('Danh sách còn trống', 'Lưu những căn phòng phù hợp để xem lại sau.', '<a class="button" href="/rooms" data-link>Tìm phòng</a>');
  } catch (error) { document.querySelector('#favorite-list').innerHTML = errorState(error.message); }
}

export async function landlordRooms() {
  if (!requireRole('landlord')) return;
  main().innerHTML = `${pageShell('Quản lý tin đăng')}<section class="container layout-sidebar">${sidebar('/landlord/rooms')}<div><div class="section-heading"><div><h2>Tin của tôi</h2><p class="muted">Theo dõi trạng thái, lượt xem và yêu thích.</p></div><a href="/rooms/new" class="button" data-link>+ Đăng phòng</a></div><div id="mine">${loadingCards(3)}</div></div></section>`;
  try {
    const result = await roomService.mine();
    document.querySelector('#mine').innerHTML = result.data.length ? `<div class="room-grid">${result.data.map((room) => roomCard(room, `<div style="margin-top:14px"><a class="button button-secondary button-small" href="/rooms/${room.id}/edit" data-link>Chỉnh sửa & dịch vụ Azure</a></div>`)).join('')}</div>` : emptyState('Chưa có tin đăng', 'Tạo bản nháp đầu tiên của bạn.', '<a class="button" href="/rooms/new" data-link>Đăng phòng</a>');
  } catch (error) { document.querySelector('#mine').innerHTML = errorState(error.message); }
}

function renderVisionEvidence(result) {
  if (!result) return '<p class="muted">Chưa có kết quả Vision.</p>';
  const verified = result.provider === 'azure-ai-vision' && result.fallbackUsed === false;
  return `<div class="azure-evidence ${verified ? 'verified' : 'failed'}">
    <strong>${verified ? 'Azure AI Vision verified' : 'Vision chưa được xác minh'}</strong>
    <span>provider=${escapeHtml(result.provider || 'unknown')} · fallbackUsed=${String(result.fallbackUsed)}</span>
    <p>${escapeHtml(result.caption || result.error || 'Không có caption')}</p>
    <div class="tag-list">${(result.tags || []).map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join('')}</div>
  </div>`;
}

async function loadVisionEvidence(room) {
  const gallery = document.querySelector('#manage-images');
  if (!gallery) return;
  if (!room.images?.length) {
    gallery.innerHTML = emptyState('Chưa có ảnh', 'Chọn ảnh JPEG, PNG hoặc WebP để tải lên Azure Blob Storage.');
    return;
  }
  gallery.innerHTML = room.images.map((image) => `<article class="panel managed-image" data-managed-image="${image.id}">
    <img src="${escapeHtml(image.url)}" alt="Ảnh phòng" />
    <div><p class="muted">Đang phân tích bằng Azure AI Vision…</p></div>
  </article>`).join('');
  await Promise.all(room.images.map(async (image) => {
    const target = document.querySelector(`[data-managed-image="${image.id}"] > div`);
    try {
      const { data } = await roomService.analyzeImage(image.id);
      if (target) target.innerHTML = renderVisionEvidence(data);
    } catch (error) {
      if (target) target.innerHTML = renderVisionEvidence({ provider: 'unavailable', fallbackUsed: true, error: error.message });
    }
  }));
}

export async function roomForm(id) {
  if (!requireRole('landlord')) return;
  let room = null;
  if (id) {
    try { room = (await roomService.manage(id)).data; } catch (error) { main().innerHTML = errorState(error.message); return; }
  }
  const value = (field, fallback = '') => escapeHtml(room?.[field] ?? fallback);
  main().innerHTML = `${pageShell(id ? 'Chỉnh sửa phòng' : 'Đăng phòng mới', 'Lưu bản nháp, xác minh vị trí và hoàn thiện ảnh trước khi gửi duyệt.')}<section class="container layout-sidebar">${sidebar('/rooms/new')}<div>
  <form class="panel detail-panel form-grid" id="room-form"><div class="field field-full"><label>Tiêu đề</label><input name="title" value="${value('title')}" required maxlength="180" /></div>
  <div class="field field-full"><label>Mô tả (ít nhất 20 ký tự)</label><textarea name="description" required minlength="20">${value('description')}</textarea></div>
  <div class="field"><label>Giá thuê/tháng</label><input name="monthlyPrice" type="number" min="1" value="${value('monthly_price')}" required /></div><div class="field"><label>Tiền cọc</label><input name="deposit" type="number" min="0" value="${value('deposit', 0)}" /></div>
  <div class="field"><label>Diện tích (m²)</label><input name="area" type="number" min="1" value="${value('area')}" required /></div><div class="field"><label>Loại phòng</label><select name="roomType"><option value="private">Phòng riêng</option><option value="studio">Studio</option><option value="dorm">Ký túc xá</option></select></div>
  <div class="field field-full"><label>Địa chỉ</label><input name="address" value="${value('address')}" required /><button class="button button-secondary button-small" type="button" data-geocode-room style="margin-top:8px">Xác minh bằng Azure Maps</button><div id="maps-evidence" style="margin-top:8px"></div></div><div class="field"><label>Tỉnh/thành phố</label><input name="province" value="${value('province', 'TP. Hồ Chí Minh')}" required /></div><div class="field"><label>Quận/huyện</label><input name="district" value="${value('district')}" required /></div>
  <div class="field"><label>Phường/xã</label><input name="ward" value="${value('ward')}" /></div><div class="field"><label>Số người tối đa</label><input name="maxOccupants" type="number" min="1" value="${value('max_occupants', 2)}" /></div>
  <div class="field"><label>Số phòng còn lại</label><input name="availableRooms" type="number" min="0" value="${value('available_rooms', 1)}" /></div><div class="field"><label><input name="allowsPets" type="checkbox" style="width:auto;min-height:auto" ${room?.allows_pets ? 'checked' : ''} /> Cho phép thú cưng</label></div>
  <div class="form-actions"><button class="button button-secondary" type="button" data-link-back>Hủy</button><button class="button">${id ? 'Cập nhật bản nháp' : 'Lưu bản nháp'}</button></div></form>
  ${id ? `<section class="panel detail-panel" style="margin-top:20px"><span class="eyebrow">Azure Blob Storage + AI Vision</span><h2>Ảnh phòng</h2>
    <form id="image-upload-form" class="form-grid"><div class="field field-full"><label>Chọn ảnh</label><input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple required /></div><div class="form-actions"><button class="button">Tải lên & phân tích</button></div></form>
    <div id="manage-images" class="managed-images" style="margin-top:20px"></div></section>
    <section class="panel detail-panel" style="margin-top:20px"><span class="eyebrow">Azure AI Content Safety</span><h2>Gửi kiểm duyệt</h2><p class="muted">Tiêu đề và mô tả hiện tại sẽ được Azure kiểm duyệt. Nếu Azure lỗi, phòng vẫn ở bản nháp với trạng thái moderation_pending.</p>
      <button class="button" type="button" data-submit-moderation ${['pending', 'active'].includes(room?.status) ? 'disabled' : ''}>${room?.status === 'pending' ? 'Đang chờ admin duyệt' : 'Kiểm duyệt & gửi duyệt'}</button><div id="moderation-evidence" style="margin-top:12px"></div>
    </section>` : ''}
  </div></section>`;
  document.querySelector('[name="roomType"]').value = room?.room_type || 'private';
  document.querySelector('#room-form').onsubmit = async (event) => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['monthlyPrice', 'deposit', 'area', 'maxOccupants', 'availableRooms']) input[key] = Number(input[key]);
    input.allowsPets = event.currentTarget.allowsPets.checked;
    try {
      const result = id ? await roomService.update(id, input) : await roomService.create(input);
      const roomId = id || result.data.id;
      toast(id ? 'Đã cập nhật bản nháp' : 'Đã tạo bản nháp');
      history.pushState({}, '', `/rooms/${roomId}/edit`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) { toast(error.message, 'error'); }
  };
  document.querySelector('[data-geocode-room]').onclick = async (event) => {
    const form = document.querySelector('#room-form');
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = 'Đang xác minh Azure Maps…';
    try {
      const { data } = await roomService.geocode({
        address: form.address.value,
        ward: form.ward.value,
        district: form.district.value,
        province: form.province.value,
      });
      if (data.provider !== 'azure-maps' || data.fallbackUsed !== false) throw new Error('Azure Maps đã dùng fallback');
      form.address.value = data.normalizedAddress;
      document.querySelector('#maps-evidence').innerHTML = `<div class="azure-evidence verified"><strong>Địa chỉ đã xác minh</strong><span>provider=${escapeHtml(data.provider)} · fallbackUsed=false</span><p>${escapeHtml(data.normalizedAddress)}</p><span>latitude=${data.latitude} · longitude=${data.longitude}</span></div>`;
    } catch (error) {
      document.querySelector('#maps-evidence').innerHTML = `<div class="azure-evidence failed"><strong>Không thể xác minh địa chỉ</strong><span>${escapeHtml(error.message)}</span></div>`;
    } finally {
      button.disabled = false;
      button.textContent = 'Xác minh bằng Azure Maps';
    }
  };
  if (id) {
    document.querySelector('#image-upload-form').onsubmit = async (event) => {
      event.preventDefault();
      const files = event.currentTarget.images.files;
      if (!files.length) return;
      const button = event.currentTarget.querySelector('button');
      button.disabled = true;
      button.textContent = 'Đang tải lên Azure…';
      try {
        const result = await roomService.uploadImages(id, files);
        const verified = result.data.every((image) => image.vision?.provider === 'azure-ai-vision' && image.vision?.fallbackUsed === false);
        toast(verified ? 'Ảnh đã lưu trên Blob và Vision xác minh thành công' : 'Ảnh đã lưu nhưng Vision chưa được xác minh', verified ? 'success' : 'error');
        await roomForm(id);
      } catch (error) {
        toast(error.message, 'error');
        button.disabled = false;
        button.textContent = 'Tải lên & phân tích';
      }
    };
    document.querySelector('[data-submit-moderation]').onclick = async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = 'Azure đang kiểm duyệt…';
      const evidence = document.querySelector('#moderation-evidence');
      try {
        const { data } = await roomService.transition(id, 'pending');
        const moderation = data.moderation;
        evidence.innerHTML = `<div class="azure-evidence verified"><strong>Nội dung đã qua kiểm duyệt và gửi duyệt</strong><span>provider=${escapeHtml(moderation.provider)} · fallbackUsed=false · status=${escapeHtml(moderation.moderationStatus)}</span></div>`;
        button.textContent = 'Đang chờ admin duyệt';
      } catch (error) {
        const moderation = error.errors?.find((item) => item.field === 'moderation');
        evidence.innerHTML = `<div class="azure-evidence failed"><strong>${escapeHtml(moderation?.moderationStatus || 'Kiểm duyệt thất bại')}</strong><span>provider=${escapeHtml(moderation?.provider || 'unknown')} · fallbackUsed=${String(moderation?.fallbackUsed ?? true)}</span><p>${escapeHtml(moderation?.message || error.message)}</p></div>`;
        button.disabled = false;
        button.textContent = 'Kiểm duyệt & gửi duyệt';
      }
    };
    await loadVisionEvidence(room);
  }
}

export async function roommateProfile() {
  if (!requireRole('tenant')) return;
  main().innerHTML = `${pageShell('Hồ sơ tìm người ở ghép')}<section class="container layout-sidebar">${sidebar('/roommate-profile')}<form class="panel detail-panel form-grid" id="roommate-form">
  <div class="field"><label>Ngân sách tối thiểu</label><input type="number" name="budgetMin" min="0" required /></div><div class="field"><label>Ngân sách tối đa</label><input type="number" name="budgetMax" min="0" required /></div>
  <div class="field"><label>Tỉnh/thành phố</label><input name="preferredProvince" value="TP. Hồ Chí Minh" required /></div><div class="field"><label>Quận/huyện</label><input name="preferredDistrict" /></div>
  <div class="field"><label>Giờ ngủ</label><input type="time" name="sleepTime" value="23:00" required /></div><div class="field"><label>Giờ thức</label><input type="time" name="wakeTime" value="06:30" required /></div>
  <div class="field"><label>Sạch sẽ (1–5)</label><input type="range" name="cleanliness" min="1" max="5" value="4" /></div><div class="field"><label>Chịu tiếng ồn (1–5)</label><input type="range" name="noiseTolerance" min="1" max="5" value="3" /></div>
  <div class="field"><label>Nấu ăn (1–5)</label><input type="range" name="cookingFrequency" min="1" max="5" value="3" /></div><div class="field"><label>Giới tính mong muốn</label><select name="preferredGender"><option value="any">Không yêu cầu</option><option value="male">Nam</option><option value="female">Nữ</option><option value="other">Khác</option></select></div>
  <div class="field field-full"><label>Trường học</label><input name="school" /></div><div class="field field-full"><label>Thói quen và sở thích</label><textarea name="habits"></textarea></div>
  <div class="field"><label><input type="checkbox" name="smoking" style="width:auto;min-height:auto" /> Có hút thuốc</label></div><div class="field"><label><input type="checkbox" name="hasPets" style="width:auto;min-height:auto" /> Có thú cưng</label></div>
  <div class="field field-full"><label><input type="checkbox" name="isLooking" checked style="width:auto;min-height:auto" /> Đang tìm người ở ghép</label></div><div class="form-actions"><button class="button">Lưu và tính tương thích</button></div></form></section>`;
  try {
    const result = await matchingService.profile();
    const form = document.querySelector('#roommate-form');
    const p = result.data;
    const mapping = { budgetMin: p.budget_min, budgetMax: p.budget_max, preferredProvince: p.preferred_province, preferredDistrict: p.preferred_district, sleepTime: p.sleep_time?.slice(0,5), wakeTime: p.wake_time?.slice(0,5), cleanliness: p.cleanliness, noiseTolerance: p.noise_tolerance, cookingFrequency: p.cooking_frequency, preferredGender: p.preferred_gender, school: p.school, habits: p.habits };
    Object.entries(mapping).forEach(([key, value]) => { if (form.elements[key] && value != null) form.elements[key].value = value; });
    form.smoking.checked = p.smoking; form.hasPets.checked = p.has_pets; form.isLooking.checked = p.is_looking;
  } catch (error) { if (error.status !== 404) toast(error.message, 'error'); }
  document.querySelector('#roommate-form').onsubmit = async (event) => {
    event.preventDefault();
    const input = Object.fromEntries(new FormData(event.currentTarget));
    ['budgetMin','budgetMax','cleanliness','noiseTolerance','cookingFrequency'].forEach((key) => input[key] = Number(input[key]));
    ['smoking','hasPets','isLooking'].forEach((key) => input[key] = event.currentTarget[key].checked);
    try { await matchingService.saveProfile(input); toast('Đã lưu hồ sơ'); history.pushState({}, '', '/matches'); window.dispatchEvent(new PopStateEvent('popstate')); } catch (error) { toast(error.message, 'error'); }
  };
}

export async function matches() {
  if (!requireRole('tenant')) return;
  main().innerHTML = `${pageShell('Người ở ghép phù hợp', 'Điểm số minh bạch dựa trên 10 tiêu chí lối sống.')}<section class="container layout-sidebar">${sidebar('/matches')}<div id="matches"><div class="page-loading"><span class="spinner"></span><p>Đang tính tương thích…</p></div></div></section>`;
  try {
    const result = await matchingService.list();
    document.querySelector('#matches').innerHTML = result.data.length ? `<div class="match-grid">${result.data.map((match) => `<article class="match-card"><div class="match-head"><div class="avatar">${escapeHtml(match.candidate.fullName).charAt(0)}</div><div><h3 style="margin:0">${escapeHtml(match.candidate.fullName)}</h3><small class="muted">${escapeHtml(match.candidate.school || 'Sinh viên')}</small></div><div class="score-ring" style="--score:${match.totalScore}"><strong>${match.totalScore}</strong></div></div>
    <div class="criteria"><p>${escapeHtml(match.explanation)}</p><div>${match.similarities.slice(0,2).map((item) => `<span class="pill" style="margin:3px">✓ ${escapeHtml(item)}</span>`).join('')}</div></div>
    <a class="button button-secondary" style="width:100%;margin-top:18px" href="/matches/${match.candidate.id}" data-link>Xem chi tiết điểm</a></article>`).join('')}</div>` : emptyState('Chưa có ứng viên', 'Hãy bật trạng thái tìm kiếm hoặc quay lại sau.');
  } catch (error) {
    document.querySelector('#matches').innerHTML = error.status === 404 ? emptyState('Bạn chưa có hồ sơ', 'Tạo hồ sơ để bắt đầu tính mức độ tương thích.', '<a class="button" href="/roommate-profile" data-link>Tạo hồ sơ</a>') : errorState(error.message);
  }
}

export async function matchDetail(id) {
  if (!requireRole('tenant')) return;
  main().innerHTML = `${pageShell('Chi tiết tương thích')}<section class="container"><div class="panel detail-panel" id="match-detail"><div class="page-loading"><span class="spinner"></span></div></div></section>`;
  try {
    const { data: match } = await matchingService.detail(id);
    const labels = { sleepWake: 'Giờ ngủ & thức', cleanliness: 'Sạch sẽ', noise: 'Tiếng ồn', smoking: 'Hút thuốc', pets: 'Thú cưng', budget: 'Ngân sách', area: 'Khu vực', gender: 'Giới tính', school: 'Trường học', keywords: 'Sở thích' };
    document.querySelector('#match-detail').innerHTML = `<div class="match-head"><div class="avatar">${escapeHtml(match.candidate.fullName).charAt(0)}</div><div><span class="eyebrow">Ứng viên</span><h2>${escapeHtml(match.candidate.fullName)}</h2></div><div class="score-ring" style="--score:${match.totalScore};width:94px;height:94px"><strong>${match.totalScore}/100</strong></div></div>
    <p>${escapeHtml(match.explanation)}</p><div class="criteria">${Object.entries(match.breakdown).map(([key, value]) => `<div class="criteria-row"><span>${labels[key]}</span><div class="progress"><span style="--value:${Math.min(100, value * 5)}%"></span></div><strong>${value}</strong></div>`).join('')}</div>
    <div class="form-grid" style="margin-top:28px"><div><h3>Điểm giống nhau</h3><ul>${match.similarities.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div><div><h3>Cần trao đổi</h3><ul>${match.conflicts.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div></div>
    <button class="button" data-chat-owner="${id}">Bắt đầu trò chuyện</button>`;
  } catch (error) { document.querySelector('#match-detail').innerHTML = errorState(error.message); }
}

export async function conversations(selectedId) {
  if (!requireAuth()) return;
  main().innerHTML = `${pageShell('Trò chuyện')}<section class="container layout-sidebar">${sidebar('/conversations')}<div class="panel chat-shell"><div class="conversation-list" id="conversation-list"></div><div class="chat-main"><div class="chat-head"><strong id="chat-title">Chọn cuộc trò chuyện</strong><small class="muted" id="chat-status"></small></div><div class="messages" id="messages">${emptyState('Chưa chọn hội thoại', 'Chọn một người để xem tin nhắn.')}</div><form class="message-form" id="message-form"><input name="content" maxlength="2000" placeholder="Viết tin nhắn…" aria-label="Tin nhắn" /><button class="button">Gửi</button></form></div></div></section>`;
  try {
    const result = await chatService.list();
    const list = document.querySelector('#conversation-list');
    list.innerHTML = result.data.length ? result.data.map((item) => `<a class="conversation ${selectedId === item.id ? 'active' : ''}" href="/conversations/${item.id}" data-link><div class="avatar">${escapeHtml(item.members[0]?.fullName || '?').charAt(0)}</div><div><strong>${escapeHtml(item.members[0]?.fullName || 'Cuộc trò chuyện')}</strong><div class="muted">${escapeHtml(item.last_message || 'Chưa có tin nhắn')}</div></div>${item.unread_count ? `<span class="badge">${item.unread_count}</span>` : ''}</a>`).join('') : emptyState('Chưa có hội thoại', 'Mở chi tiết phòng hoặc một kết quả ghép để bắt đầu.');
    if (selectedId) {
      await loadMessages(selectedId, result.data.find((item) => item.id === selectedId));
      chatService.connect({
        onMessage: (message) => {
          if (message.conversation_id === selectedId) loadMessages(selectedId);
        },
        onDelete: () => loadMessages(selectedId),
        onTyping: (typing) => {
          if (typing.conversationId === selectedId) {
            document.querySelector('#chat-status').textContent = typing.typing ? 'Đang nhập…' : '';
          }
        },
        onPresence: (presence) => {
          const otherId = result.data.find((item) => item.id === selectedId)?.members?.[0]?.id;
          if (presence.userId === otherId) {
            document.querySelector('#chat-status').textContent = presence.online ? 'Đang online' : 'Đã offline';
          }
        },
      });
      chatService.join(selectedId);
    }
  } catch (error) { document.querySelector('#conversation-list').innerHTML = errorState(error.message); }
  document.querySelector('#message-form').onsubmit = async (event) => {
    event.preventDefault();
    if (!selectedId) return toast('Hãy chọn cuộc trò chuyện', 'error');
    const content = event.currentTarget.content.value.trim();
    if (!content) return;
    try { await chatService.send(selectedId, content); event.currentTarget.reset(); await loadMessages(selectedId); } catch (error) { toast(error.message, 'error'); }
  };
  const messageInput = document.querySelector('#message-form input');
  messageInput.oninput = () => {
    if (!selectedId) return;
    chatService.typing(selectedId, Boolean(messageInput.value.trim()));
  };
}

async function loadMessages(id, conversation) {
  const result = await chatService.messages(id);
  document.querySelector('#chat-title').textContent = conversation?.members?.[0]?.fullName || 'Cuộc trò chuyện';
  const box = document.querySelector('#messages');
  box.innerHTML = result.data.length ? result.data.map((message) => `<div class="message ${message.sender_id === state.user.id ? 'mine' : ''}">${escapeHtml(message.content)}<small style="display:block;opacity:.7">${new Date(message.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</small></div>`).join('') : emptyState('Chưa có tin nhắn', 'Hãy gửi lời chào đầu tiên.');
  box.scrollTop = box.scrollHeight;
  chatService.read(id).catch(() => {});
}

export async function notifications() {
  if (!requireAuth()) return;
  main().innerHTML = `${pageShell('Thông báo')}<section class="container layout-sidebar">${sidebar('/notifications')}<div><div class="section-heading"><h2>Cập nhật mới nhất</h2><button class="button button-secondary button-small" data-read-all>Đọc tất cả</button></div><div class="list-stack" id="notification-list"><div class="page-loading"><span class="spinner"></span></div></div></div></section>`;
  try {
    const result = await notificationService.list();
    document.querySelector('#notification-list').innerHTML = result.data.length ? result.data.map((item) => `<article class="panel list-item ${item.read_at ? '' : 'unread'}"><div class="feature-icon">♢</div><div><strong>${escapeHtml(item.title)}</strong><p class="muted">${escapeHtml(item.body)}</p><small>${date(item.created_at)}</small></div>${item.link ? `<a class="button button-secondary button-small" href="${item.link}" data-link>Xem</a>` : ''}</article>`).join('') : emptyState('Bạn đã xem hết', 'Thông báo mới sẽ xuất hiện tại đây.');
  } catch (error) { document.querySelector('#notification-list').innerHTML = errorState(error.message); }
  document.querySelector('[data-read-all]').onclick = async () => { await notificationService.readAll(); toast('Đã đánh dấu tất cả là đã đọc'); notifications(); };
}

export async function reports() {
  if (!requireAuth()) return;
  const roomId = new URLSearchParams(location.search).get('roomId') || '';
  main().innerHTML = `${pageShell('Báo cáo tin vi phạm')}<section class="container layout-sidebar">${sidebar('/reports')}<div><form class="panel detail-panel form-grid" id="report-form">
  <div class="field field-full"><label>ID phòng</label><input name="roomId" value="${escapeHtml(roomId)}" required /></div><div class="field field-full"><label>Lý do</label><select name="reason"><option value="incorrect_info">Thông tin sai</option><option value="wrong_price">Giá không đúng</option><option value="scam">Dấu hiệu lừa đảo</option><option value="wrong_images">Hình ảnh không đúng</option><option value="inappropriate">Nội dung không phù hợp</option><option value="expired">Tin đã hết hạn</option><option value="other">Khác</option></select></div>
  <div class="field field-full"><label>Mô tả</label><textarea name="description" maxlength="1000"></textarea></div><div class="form-actions"><button class="button button-danger">Gửi báo cáo</button></div></form><h2 style="margin-top:36px">Báo cáo của bạn</h2><div id="my-reports"></div></div></section>`;
  document.querySelector('#report-form').onsubmit = async (event) => {
    event.preventDefault();
    if (!(await confirmDialog({ title: 'Gửi báo cáo?', message: 'Quản trị viên sẽ kiểm tra nội dung bạn cung cấp.', confirmText: 'Gửi báo cáo', danger: true }))) return;
    try { await reportService.create(Object.fromEntries(new FormData(event.currentTarget))); toast('Đã gửi báo cáo'); reports(); } catch (error) { toast(error.message, 'error'); }
  };
  try {
    const result = await reportService.list();
    document.querySelector('#my-reports').innerHTML = result.data.length ? `<div class="list-stack">${result.data.map((item) => `<div class="panel list-item"><div><strong>${escapeHtml(item.title)}</strong><p class="muted">${item.reason} · ${item.status}</p></div></div>`).join('')}</div>` : emptyState('Chưa có báo cáo', 'Các báo cáo bạn gửi sẽ hiển thị tại đây.');
  } catch (error) { document.querySelector('#my-reports').innerHTML = errorState(error.message); }
}

export async function adminDashboard() {
  if (!requireRole('admin')) return;
  main().innerHTML = `${pageShell('Tổng quan quản trị')}<section class="container layout-sidebar">${sidebar('/admin')}<div id="dashboard"><div class="page-loading"><span class="spinner"></span></div></div></section>`;
  try {
    const { data: stats } = await adminService.dashboard();
    const metrics = [['Người dùng', stats.total_users], ['Tenant', stats.total_tenants], ['Landlord', stats.total_landlords], ['Tổng phòng', stats.total_rooms], ['Phòng active', stats.active_rooms], ['Chờ duyệt', stats.pending_rooms], ['Hội thoại', stats.conversations], ['Báo cáo mở', stats.unresolved_reports]];
    document.querySelector('#dashboard').innerHTML = `<div class="dashboard-grid">${metrics.map(([label, value]) => `<div class="panel metric"><small>${label}</small><strong>${value}</strong></div>`).join('')}</div><div class="panel detail-panel"><h2>7 ngày gần nhất</h2><div class="criteria">${stats.chart.map((item) => `<div class="criteria-row"><span>${date(item.day)}</span><div class="progress"><span style="--value:${Math.min(100, (item.new_users + item.new_rooms) * 15)}%"></span></div><strong>${item.new_users + item.new_rooms}</strong></div>`).join('')}</div></div>`;
  } catch (error) { document.querySelector('#dashboard').innerHTML = errorState(error.message); }
}

export async function adminUsers() {
  if (!requireRole('admin')) return;
  main().innerHTML = `${pageShell('Quản lý người dùng')}<section class="container layout-sidebar">${sidebar('/admin/users')}<div class="panel detail-panel"><div class="table-wrap" id="admin-users"><div class="page-loading"><span class="spinner"></span></div></div></div></section>`;
  try {
    const result = await adminService.users();
    document.querySelector('#admin-users').innerHTML = `<table><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th></th></tr></thead><tbody>${result.data.map((user) => `<tr><td><strong>${escapeHtml(user.full_name)}</strong><br><small>${escapeHtml(user.email)}</small></td><td>${user.role}</td><td><span class="pill">${user.status}</span></td><td>${date(user.created_at)}</td><td>${user.role !== 'admin' ? `<button class="button button-small ${user.status === 'active' ? 'button-danger' : ''}" data-user-status="${user.id}" data-status="${user.status === 'active' ? 'locked' : 'active'}">${user.status === 'active' ? 'Khóa' : 'Mở khóa'}</button>` : ''}</td></tr>`).join('')}</tbody></table>`;
    document.querySelectorAll('[data-user-status]').forEach((button) => button.onclick = async () => {
      if (!(await confirmDialog({ title: 'Đổi trạng thái tài khoản?', message: 'Thao tác này được ghi vào audit log.', danger: button.dataset.status === 'locked' }))) return;
      try { await adminService.setUserStatus(button.dataset.userStatus, button.dataset.status); toast('Đã cập nhật tài khoản'); adminUsers(); } catch (error) { toast(error.message, 'error'); }
    });
  } catch (error) { document.querySelector('#admin-users').innerHTML = errorState(error.message); }
}

export async function adminRooms() {
  if (!requireRole('admin')) return;
  main().innerHTML = `${pageShell('Kiểm duyệt phòng')}<section class="container layout-sidebar">${sidebar('/admin/rooms')}<div id="admin-rooms">${loadingCards(3)}</div></section>`;
  try {
    const result = await adminService.rooms('status=pending');
    document.querySelector('#admin-rooms').innerHTML = result.data.length ? `<div class="room-grid">${result.data.map((room) => `<article class="room-card"><div class="room-media"><div class="room-placeholder">Chờ duyệt</div></div><div class="room-body"><h3>${escapeHtml(room.title)}</h3><p class="muted">${escapeHtml(room.landlord_name)} · ${money(room.monthly_price)}đ</p><div style="display:flex;gap:8px"><button class="button button-small" data-moderate="${room.id}" data-status="active">Duyệt</button><button class="button button-danger button-small" data-moderate="${room.id}" data-status="rejected">Từ chối</button></div></div></article>`).join('')}</div>` : emptyState('Không còn tin chờ duyệt', 'Hàng đợi kiểm duyệt đã được xử lý.');
    document.querySelectorAll('[data-moderate]').forEach((button) => button.onclick = async () => {
      const reason = button.dataset.status === 'rejected' ? prompt('Lý do từ chối:') : '';
      if (button.dataset.status === 'rejected' && !reason) return;
      try { await adminService.moderateRoom(button.dataset.moderate, { status: button.dataset.status, reason }); toast('Đã xử lý tin'); adminRooms(); } catch (error) { toast(error.message, 'error'); }
    });
  } catch (error) { document.querySelector('#admin-rooms').innerHTML = errorState(error.message); }
}

export async function adminReports() {
  if (!requireRole('admin')) return;
  main().innerHTML = `${pageShell('Xử lý báo cáo')}<section class="container layout-sidebar">${sidebar('/admin/reports')}<div class="list-stack" id="admin-reports"><div class="page-loading"><span class="spinner"></span></div></div></section>`;
  try {
    const result = await adminService.reports();
    document.querySelector('#admin-reports').innerHTML = result.data.length ? result.data.map((item) => `<article class="panel list-item"><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description || item.reason)}</p><small class="muted">${escapeHtml(item.reporter_name)} · ${item.status}</small></div><div class="actions"><button class="button button-small" data-report="${item.id}" data-report-status="resolved">Giải quyết</button><button class="button button-secondary button-small" data-report="${item.id}" data-report-status="rejected">Bác bỏ</button></div></article>`).join('') : emptyState('Không có báo cáo', 'Tất cả báo cáo đã được xử lý.');
    document.querySelectorAll('[data-report]').forEach((button) => button.onclick = async () => {
      const adminNote = prompt('Ghi chú xử lý:') || '';
      try { await adminService.resolveReport(button.dataset.report, { status: button.dataset.reportStatus, adminNote, hideRoom: false }); toast('Đã xử lý báo cáo'); adminReports(); } catch (error) { toast(error.message, 'error'); }
    });
  } catch (error) { document.querySelector('#admin-reports').innerHTML = errorState(error.message); }
}

export function notFound() {
  main().innerHTML = `<section class="container section"><div class="empty"><div><span class="eyebrow">404</span><h1>Trang không tồn tại</h1><p class="muted">Có vẻ đường dẫn này đã chuyển đi nơi khác.</p><a class="button" href="/" data-link>Về trang chủ</a></div></div></section>`;
}
