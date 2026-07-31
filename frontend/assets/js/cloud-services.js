let servicesData = [];

function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }[m];
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

async function testService(serviceName) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  if (!modal || !title || !body) return;

  title.textContent = `Test Endpoint: ${serviceName}`;
  body.innerHTML = 'Đang gửi request kiểm thử...';
  modal.style.display = 'flex';

  let endpoint = '';
  let method = 'GET';
  let reqBody = null;

  if (serviceName.includes('App Configuration')) {
    endpoint = '/api/cloud/app-configuration/status';
  } else if (serviceName.includes('Content Safety')) {
    endpoint = '/api/cloud/content-safety/test';
    method = 'POST';
    reqBody = { text: 'Kiểm tra mô tả phòng trọ an toàn.' };
  } else if (serviceName.includes('Language')) {
    endpoint = '/api/cloud/language/analyze';
    method = 'POST';
    reqBody = { text: 'Phòng sạch sẽ, giá cả hợp lý.' };
  } else if (serviceName.includes('Translator')) {
    endpoint = '/api/cloud/translator/translate';
    method = 'POST';
    reqBody = { text: 'Cho thuê phòng trọ giá tốt', targetLanguage: 'en' };
  } else if (serviceName.includes('Vision')) {
    endpoint = '/api/cloud/vision/analyze';
    method = 'POST';
  } else if (serviceName.includes('Maps')) {
    endpoint = '/api/cloud/maps/geocode?query=District+1+Ho+Chi+Minh';
  } else if (serviceName.includes('Search')) {
    endpoint = '/api/cloud/search/status';
  } else if (serviceName.includes('Speech')) {
    endpoint = '/api/cloud/speech/synthesize';
    method = 'POST';
    reqBody = { text: 'Xin chào' };
  } else if (serviceName.includes('Communication')) {
    endpoint = '/api/cloud/email/send-test';
    method = 'POST';
  } else if (serviceName.includes('Notification')) {
    endpoint = '/api/cloud/notifications/status';
  } else if (serviceName.includes('Custom Vision')) {
    endpoint = '/api/cloud/custom-vision/status';
  } else if (serviceName.includes('Action Group')) {
    endpoint = '/api/cloud/monitor/status';
  } else {
    endpoint = '/api/health';
  }

  try {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (reqBody) options.body = JSON.stringify(reqBody);

    const res = await fetch(endpoint, options);
    const data = await res.json();

    body.innerHTML = `
      <p><strong>Endpoint:</strong> <code>${escapeHtml(endpoint)}</code></p>
      <p><strong>HTTP Status:</strong> ${res.status}</p>
      <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    `;
  } catch (err) {
    body.innerHTML = `<p style="color:red">Lỗi khi gọi endpoint: ${escapeHtml(err.message)}</p>`;
  }
}

function renderTable(list) {
  const tbody = document.getElementById('services-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  list.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td><strong>${escapeHtml(item.service)}</strong></td>
      <td><code>${escapeHtml(item.resourceName)}</code></td>
      <td><span class="badge badge-${escapeHtml(item.integrationStatus)}">${escapeHtml(item.integrationStatus)}</span></td>
      <td style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(item.evidenceType)}<br><em>${escapeHtml(item.message)}</em></td>
      <td><button class="btn test-service-btn" data-service="${escapeHtml(item.service)}">Test Endpoint</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function fetchStatus() {
  try {
    const res = await fetch('/api/cloud/services/status');
    const data = await res.json();
    servicesData = data.services || [];

    const cntWorking = document.getElementById('cnt-working');
    const cntConfigured = document.getElementById('cnt-configured');
    const cntBlocked = document.getElementById('cnt-blocked');
    const cntResourceOnly = document.getElementById('cnt-resource-only');

    if (cntWorking) cntWorking.textContent = data.summary?.WORKING || 0;
    if (cntConfigured) cntConfigured.textContent = data.summary?.CONFIGURED || 0;
    if (cntBlocked) cntBlocked.textContent = data.summary?.BLOCKED || 0;
    if (cntResourceOnly) cntResourceOnly.textContent = data.summary?.RESOURCE_ONLY || 0;

    renderTable(servicesData);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchStatus();

  const refreshBtn = document.getElementById('btn-refresh');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchStatus);
  }

  const closeBtn = document.getElementById('btn-close-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  const tbody = document.getElementById('services-tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const target = e.target;
      if (target && target.classList.contains('test-service-btn')) {
        const serviceName = target.getAttribute('data-service');
        if (serviceName) {
          testService(serviceName);
        }
      }
    });
  }
});
