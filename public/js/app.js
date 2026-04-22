// ==================== State ====================
let currentPage = 'home';
let currentCompanyId = null;
let companies = [];
let stats = {};
let discrepancies = [];

// ==================== Language ====================
function switchLanguage() {
  const newLang = toggleLang();
  updateSidebarLanguage();
  updateHeaderLanguage();
  // Re-render current page
  if (currentPage === 'company-detail' && currentCompanyId) {
    renderCompanyDetail(currentCompanyId);
  } else {
    navigate(currentPage);
  }
}

function updateSidebarLanguage() {
  const lang = getLang();
  document.getElementById('lang-flag').textContent = lang === 'de' ? 'DE' : 'EN';
  document.getElementById('lang-label').textContent = lang === 'de' ? 'Deutsch' : 'English';

  // Update nav items
  const navItems = document.querySelectorAll('.nav-item');
  const navLabels = [
    'nav.commandCenter', 'nav.portfolioGrid', 'nav.companies', 'nav.scanAll',
    'nav.discrepancies', 'nav.reports', 'nav.export'
  ];
  navItems.forEach((item, i) => {
    if (navLabels[i]) {
      // Keep the SVG, update only text
      const svg = item.querySelector('svg');
      const badge = item.querySelector('.nav-badge');
      item.textContent = '';
      if (svg) item.appendChild(svg);
      item.appendChild(document.createTextNode(' ' + t(navLabels[i])));
      if (badge) item.appendChild(badge);
    }
  });

  // Update section labels
  const sectionLabels = document.querySelectorAll('.nav-section-label');
  const sectionKeys = ['nav.overview', 'nav.management', 'nav.intelligence'];
  sectionLabels.forEach((el, i) => {
    if (sectionKeys[i]) el.textContent = t(sectionKeys[i]);
  });

  // Update header buttons
  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    const btns = headerActions.querySelectorAll('.btn');
    if (btns[0]) {
      const svg0 = btns[0].querySelector('svg');
      btns[0].textContent = '';
      if (svg0) btns[0].appendChild(svg0);
      btns[0].appendChild(document.createTextNode(' ' + t('header.scanAll')));
    }
    if (btns[1]) {
      const svg1 = btns[1].querySelector('svg');
      btns[1].textContent = '';
      if (svg1) btns[1].appendChild(svg1);
      btns[1].appendChild(document.createTextNode(' ' + t('header.addCompany')));
    }
  }
}

function updateHeaderLanguage() {
  const titles = {
    home: ['page.commandCenter', 'page.commandCenter.sub'],
    dashboard: ['page.portfolioGrid', 'page.portfolioGrid.sub'],
    companies: ['page.companies', 'page.companies.sub'],
    discrepancies: ['page.discrepancies', 'page.discrepancies.sub'],
    'company-detail': ['page.companyDetail', '']
  };
  const [titleKey, subKey] = titles[currentPage] || ['page.commandCenter', ''];
  document.getElementById('header-title').textContent = t(titleKey);
  document.getElementById('header-breadcrumb').textContent = subKey ? t(subKey) : '';
}

// ==================== Navigation ====================
function navigate(page, data) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  updateHeaderLanguage();

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  switch (page) {
    case 'home': renderHome(); break;
    case 'dashboard': renderDashboard(); break;
    case 'companies': renderCompanies(); break;
    case 'company-detail': renderCompanyDetail(data); break;
    case 'discrepancies': renderDiscrepancies(); break;
    default: renderHome();
  }
}

// ==================== API Helpers ====================
async function api(url, opts = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...opts.headers },
      ...opts
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('API Error:', err);
    showToast(t('toast.connectionError'), 'error');
    return null;
  }
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const icons = { success: '\u2713', error: '\u2717', info: '\u2139' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span style="font-weight:700">${icons[type] || ''}</span> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; setTimeout(() => toast.remove(), 300); }, 3500);
}

function scoreColor(score) {
  if (score >= 80) return 'var(--green)';
  if (score >= 60) return 'var(--yellow)';
  if (score >= 40) return 'var(--orange)';
  return 'var(--red)';
}

function fillClass(score) {
  if (score >= 80) return 'fill-green';
  if (score >= 60) return 'fill-yellow';
  if (score >= 40) return 'fill-orange';
  return 'fill-red';
}

function scoreGaugeSVG(score, size = 64) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return `
    <div class="score-gauge" style="width:${size}px;height:${size}px">
      <svg width="${size}" height="${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="3.5"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="3.5"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"
          style="transition: stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)"/>
      </svg>
      <div class="value" style="color:${color}">${score || '\u2014'}</div>
    </div>`;
}

function timeAgo(dateStr) {
  if (!dateStr) return getLang() === 'de' ? 'Nie' : 'Never';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return getLang() === 'de' ? 'Gerade eben' : 'Just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString(getLang() === 'de' ? 'de-DE' : 'en-US');
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function ensureProtocol(url) {
  if (!url) return '#';
  if (!url.startsWith('http')) return 'https://' + url;
  return url;
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ==================== Home Page ====================
async function renderHome() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const [statsData, discData, companiesData] = await Promise.all([
    api('/api/dashboard/stats'),
    api('/api/dashboard/discrepancies'),
    api('/api/dashboard/companies')
  ]);

  if (!statsData) {
    app.innerHTML = `<div class="empty-state"><div class="empty-title">${t('empty.noData')}</div><div class="empty-desc">${t('empty.noDataDesc')}</div></div>`;
    return;
  }

  stats = statsData;
  discrepancies = discData || [];
  companies = companiesData || [];

  // Update discrepancy badge
  const badge = document.getElementById('discrepancy-badge');
  const totalDisc = discrepancies.reduce((sum, d) => sum + (d.discrepancies?.length || 0), 0);
  if (totalDisc > 0) { badge.textContent = totalDisc; badge.style.display = 'inline'; }
  else { badge.style.display = 'none'; }

  // If no companies, show onboarding
  if (companies.length === 0) {
    app.innerHTML = renderOnboarding();
    return;
  }

  let html = '';

  // Stats
  html += `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">${t('stats.portfolioCompanies')}</div>
        <div class="stat-value">${stats.totalCompanies}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t('stats.avgScore')}</div>
        <div class="stat-value ${stats.avgScore >= 70 ? 'good' : stats.avgScore < 50 ? 'alert' : ''}">${stats.avgScore}<span class="suffix">/100</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t('stats.criticalIssues')}</div>
        <div class="stat-value ${stats.criticalIssues > 0 ? 'alert' : ''}">${stats.criticalIssues}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t('stats.scansToday')}</div>
        <div class="stat-value">${stats.scansToday}</div>
      </div>
    </div>`;

  // Discrepancy banner
  if (discrepancies.length > 0) {
    const discWord = totalDisc > 1 ? t('disc.mismatches') : t('disc.mismatch');
    const compWord = discrepancies.length > 1 ? t('disc.companies') : t('disc.company');
    html += `
      <div class="discrepancy-banner">
        <div class="discrepancy-header">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <h3>${t('disc.detected')} \u2014 ${totalDisc} ${discWord} ${t('disc.across')} ${discrepancies.length} ${compWord}</h3>
        </div>`;

    for (const item of discrepancies) {
      html += `
        <div style="margin-bottom:14px">
          <div style="font-size:13px;font-weight:700;margin-bottom:6px;cursor:pointer;color:var(--text-primary)" onclick="navigate('company-detail',${item.companyId})">
            ${escapeHtml(item.companyName)} <span style="color:var(--text-muted);font-weight:400;font-size:11px">${escapeHtml(item.companyUrl)}</span>
          </div>
          <table class="discrepancy-table">
            <tr><th>${t('disc.field')}</th><th>${t('disc.dbRecord')}</th><th>${t('disc.liveWebsite')}</th><th>${t('disc.severity')}</th></tr>
            ${(item.discrepancies || []).map(d => `
              <tr>
                <td style="font-weight:600">${escapeHtml(d.field)}</td>
                <td>${escapeHtml(d.dbValue)}</td>
                <td>${escapeHtml(d.websiteValue)}</td>
                <td class="severity-${d.severity}">${(d.severity || '').toUpperCase()}</td>
              </tr>
            `).join('')}
          </table>
        </div>`;
    }
    html += `</div>`;
  }

  // Tutorial banner for demo company
  const hasDemo = companies.some(c => c.name && c.name.includes('(Demo)'));
  if (hasDemo) {
    html += `
      <div class="tutorial-banner">
        <div class="tutorial-banner-icon">\uD83C\uDF93</div>
        <div class="tutorial-banner-text">
          <div class="tutorial-banner-title">${t('tutorial.title')}</div>
          <div class="tutorial-banner-desc">${t('tutorial.desc')}</div>
        </div>
      </div>`;
  }

  // Company cards
  html += `<div class="cards-grid">`;
  for (const c of companies) {
    const scan = c.latestScan;
    const score = scan?.overall_score || 0;
    const isDemo = c.name && c.name.includes('(Demo)');
    html += `
      <div class="company-card" onclick="navigate('company-detail',${c.id})">
        <div class="card-header">
          <div>
            <div class="card-name">${escapeHtml(c.name)}</div>
            <div class="card-url">${escapeHtml(c.url)}</div>
            <div class="card-tags">
              ${c.sector ? `<span class="tag tag-sector">${escapeHtml(c.sector)}</span>` : ''}
              ${c.hosting_platform ? `<span class="tag tag-platform">${escapeHtml(c.hosting_platform)}</span>` : ''}
              ${c.is_parked_domain ? '<span class="tag tag-parked">PARKED</span>' : ''}
              ${isDemo ? '<span class="tag tag-demo">DEMO</span>' : ''}
            </div>
          </div>
          ${scan ? scoreGaugeSVG(score) : `<div style="font-size:11px;color:var(--text-subtle);padding:8px">${t('card.noScan')}</div>`}
        </div>
        ${scan ? `
          <div class="score-bars">
            ${[t('score.meta'), t('score.content'), t('score.technical'), t('score.legal')].map((label, i) => {
              const val = [scan.meta_score, scan.content_score, scan.technical_score, scan.legal_score][i] || 0;
              return `<div><div class="score-bar-label"><span>${label}</span><span>${val}</span></div><div class="score-bar-track"><div class="score-bar-fill ${fillClass(val)}" style="width:${val}%"></div></div></div>`;
            }).join('')}
          </div>
          <div class="badges">
            <span class="badge ${scan.has_impressum ? 'badge-ok' : 'badge-fail'}">${scan.has_impressum ? '\u2713' : '\u2717'} ${t('legal.impressum')}</span>
            <span class="badge ${scan.has_privacy_policy ? 'badge-ok' : 'badge-fail'}">${scan.has_privacy_policy ? '\u2713' : '\u2717'} ${t('legal.privacy')}</span>
            <span class="badge ${scan.has_terms_of_service ? 'badge-ok' : 'badge-fail'}">${scan.has_terms_of_service ? '\u2713' : '\u2717'} ${t('legal.terms')}</span>
          </div>
          <div class="card-footer">${t('card.scanned')} ${timeAgo(scan.scanned_at)} \u00B7 ${scan.pages_crawled || 0} ${t('card.pagesCrawled')}</div>
        ` : `<div class="card-footer">${t('card.noScanClick')}</div>`}
      </div>`;
  }
  html += `</div>`;

  app.innerHTML = html;
}

// ==================== Onboarding ====================
function renderOnboarding() {
  return `
    <div class="welcome-section">
      <div class="welcome-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 3l11 6.5v13L16 29 5 22.5v-13z" stroke="white" stroke-width="1.5" fill="none"/>
          <circle cx="16" cy="16" r="4" fill="white" opacity="0.9"/>
        </svg>
      </div>
      <h1 class="welcome-title">${t('onboard.welcome')}</h1>
      <p class="welcome-subtitle">${t('onboard.subtitle')}</p>

      <div class="welcome-features">
        <div class="welcome-feature">
          <div class="welcome-feature-icon">\uD83D\uDD0D</div>
          <div class="welcome-feature-title">${t('onboard.feature1.title')}</div>
          <div class="welcome-feature-desc">${t('onboard.feature1.desc')}</div>
        </div>
        <div class="welcome-feature">
          <div class="welcome-feature-icon">\u2696\uFE0F</div>
          <div class="welcome-feature-title">${t('onboard.feature2.title')}</div>
          <div class="welcome-feature-desc">${t('onboard.feature2.desc')}</div>
        </div>
        <div class="welcome-feature">
          <div class="welcome-feature-icon">\u26A0\uFE0F</div>
          <div class="welcome-feature-title">${t('onboard.feature3.title')}</div>
          <div class="welcome-feature-desc">${t('onboard.feature3.desc')}</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-primary" onclick="showAddCompanyModal()" style="padding:12px 28px;font-size:14px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ${t('onboard.addFirst')}
        </button>
        <button class="btn" onclick="seedDemoCompany()" style="padding:12px 28px;font-size:14px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          ${t('onboard.tryDemo')}
        </button>
      </div>
    </div>`;
}

async function seedDemoCompany() {
  showToast(t('toast.demoCreated'), 'info');
  const result = await api('/api/seed-demo', { method: 'POST' });
  if (result && result.success) {
    navigate('home');
  }
}

// ==================== Dashboard Grid ====================
async function renderDashboard() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const companiesData = await api('/api/dashboard/companies');
  if (!companiesData) return;
  companies = companiesData;

  if (companies.length === 0) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">\uD83D\uDCCA</div><div class="empty-title">${t('empty.noDashboard')}</div><div class="empty-desc">${t('empty.noDashboardDesc')}</div><button class="btn btn-primary" onclick="showAddCompanyModal()">+ ${t('header.addCompany')}</button></div>`;
    return;
  }

  let html = `<div class="cards-grid">`;
  for (const c of companies) {
    const scan = c.latestScan;
    const score = scan?.overall_score || 0;
    html += `
      <div class="company-card" onclick="navigate('company-detail',${c.id})">
        <div class="card-header">
          <div>
            <div class="card-name">${escapeHtml(c.name)}</div>
            <div class="card-url">${escapeHtml(c.url)}</div>
          </div>
          ${scan ? scoreGaugeSVG(score) : `<div style="font-size:11px;color:var(--text-subtle)">${t('card.noScan')}</div>`}
        </div>
        ${scan ? `
          <div class="score-bars">
            ${[t('score.meta'), t('score.content'), t('score.technical'), t('score.legal')].map((label, i) => {
              const val = [scan.meta_score, scan.content_score, scan.technical_score, scan.legal_score][i] || 0;
              return `<div><div class="score-bar-label"><span>${label}</span><span>${val}</span></div><div class="score-bar-track"><div class="score-bar-fill ${fillClass(val)}" style="width:${val}%"></div></div></div>`;
            }).join('')}
          </div>
          <div class="badges">
            <span class="badge ${scan.has_impressum ? 'badge-ok' : 'badge-fail'}">${scan.has_impressum ? '\u2713' : '\u2717'} ${t('legal.impressum')}</span>
            <span class="badge ${scan.has_privacy_policy ? 'badge-ok' : 'badge-fail'}">${scan.has_privacy_policy ? '\u2713' : '\u2717'} ${t('legal.privacy')}</span>
            <span class="badge ${scan.has_terms_of_service ? 'badge-ok' : 'badge-fail'}">${scan.has_terms_of_service ? '\u2713' : '\u2717'} ${t('legal.terms')}</span>
          </div>
          <div class="card-footer">${t('card.scanned')} ${timeAgo(scan.scanned_at)}</div>
        ` : `<div class="card-footer" style="text-align:center">${t('card.noScan')}</div>`}
      </div>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

// ==================== Companies List ====================
async function renderCompanies() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const data = await api('/api/companies');
  if (!data) return;

  if (data.length === 0) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">\uD83C\uDFE2</div><div class="empty-title">${t('empty.noCompanies')}</div><div class="empty-desc">${t('empty.noCompaniesDesc')}</div><button class="btn btn-primary" onclick="showAddCompanyModal()">+ ${t('header.addCompany')}</button></div>`;
    return;
  }

  let html = `<div style="display:flex;flex-direction:column;gap:6px">`;
  for (const c of data) {
    html += `
      <div class="company-list-item" onclick="navigate('company-detail',${c.id})">
        <div>
          <div class="doc-name">${escapeHtml(c.name)}</div>
          <div class="doc-meta">${escapeHtml(c.url)} ${c.sector ? '\u00B7 ' + escapeHtml(c.sector) : ''} ${c.hosting_platform ? '\u00B7 ' + escapeHtml(c.hosting_platform) : ''}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="event.stopPropagation();triggerScan(${c.id})">${t('detail.rescan')}</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteCompany(${c.id},'${escapeHtml(c.name).replace(/'/g, "\\'")}')">${t('docs.delete')}</button>
        </div>
      </div>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

// ==================== Discrepancies Page ====================
async function renderDiscrepancies() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const discData = await api('/api/dashboard/discrepancies');
  if (!discData) return;
  discrepancies = discData;

  const totalDisc = discrepancies.reduce((sum, d) => sum + (d.discrepancies?.length || 0), 0);

  if (totalDisc === 0) {
    app.innerHTML = `<div class="empty-state"><div class="empty-icon">\u2705</div><div class="empty-title">${t('disc.noDiscrepancies')}</div><div class="empty-desc">${t('disc.allMatch')}</div></div>`;
    return;
  }

  const discWord = totalDisc > 1 ? t('disc.mismatches') : t('disc.mismatch');
  const compWord = discrepancies.length > 1 ? t('disc.companies') : t('disc.company');

  let html = `
    <div class="discrepancy-banner">
      <div class="discrepancy-header">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <h3>${totalDisc} ${discWord} ${t('disc.across')} ${discrepancies.length} ${compWord}</h3>
      </div>`;

  for (const item of discrepancies) {
    html += `
      <div style="margin-bottom:16px">
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;cursor:pointer" onclick="navigate('company-detail',${item.companyId})">
          ${escapeHtml(item.companyName)} <span style="color:var(--text-muted);font-weight:400;font-size:12px">\u2014 ${escapeHtml(item.companyUrl)}</span>
        </div>
        <table class="discrepancy-table">
          <tr><th>${t('disc.field')}</th><th>${t('disc.dbRecord')}</th><th>${t('disc.liveWebsite')}</th><th>${t('disc.severity')}</th></tr>
          ${(item.discrepancies || []).map(d => `
            <tr>
              <td style="font-weight:600">${escapeHtml(d.field)}</td>
              <td>${escapeHtml(d.dbValue)}</td>
              <td>${escapeHtml(d.websiteValue)}</td>
              <td class="severity-${d.severity}">${(d.severity || '').toUpperCase()}</td>
            </tr>
          `).join('')}
        </table>
      </div>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

// ==================== Company Detail ====================
async function renderCompanyDetail(companyId) {
  currentCompanyId = companyId;
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const data = await api(`/api/companies/${companyId}`);
  if (!data) return;
  const scan = data.latestScan;

  document.getElementById('header-title').textContent = data.name;
  document.getElementById('header-breadcrumb').textContent = data.url;

  let html = `
    <div class="detail-header">
      <div class="detail-back" onclick="navigate('home')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        ${t('detail.back')}
      </div>
      <div class="detail-title-row">
        <div>
          <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.03em;margin-bottom:4px">${escapeHtml(data.name)}</h1>
          <p style="font-size:13px;color:var(--text-muted)"><a href="${ensureProtocol(data.url)}" target="_blank" style="color:var(--accent-400)">${escapeHtml(data.url)}</a>
            ${data.sector ? ` \u00B7 ${escapeHtml(data.sector)}` : ''}
            ${data.hosting_platform ? ` \u00B7 ${escapeHtml(data.hosting_platform)}` : ''}
          </p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="triggerScan(${data.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
            ${t('detail.rescan')}
          </button>
          <button class="btn" onclick="showFixPrompt(${data.id})">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${t('detail.fixPrompt')}
          </button>
          <button class="btn" onclick="showEditCompanyModal(${JSON.stringify(data).replace(/"/g, '&quot;')})">${t('detail.edit')}</button>
        </div>
      </div>
    </div>`;

  // Discrepancy alert
  if (scan) {
    const disc = JSON.parse(scan.discrepancies_json || '[]');
    if (disc.length > 0) {
      const discWord = disc.length > 1 ? t('disc.mismatches') : t('disc.mismatch');
      html += `
        <div class="discrepancy-banner">
          <div class="discrepancy-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <h3>${t('detail.discrepancy')} \u2014 ${disc.length} ${discWord} ${t('detail.between')}</h3>
          </div>
          <table class="discrepancy-table">
            <tr><th>${t('disc.field')}</th><th>${t('disc.dbRecord')}</th><th>${t('disc.liveWebsite')}</th><th>${t('disc.severity')}</th></tr>
            ${disc.map(d => `
              <tr>
                <td style="font-weight:600">${escapeHtml(d.field)}</td>
                <td>${escapeHtml(d.dbValue)}</td>
                <td>${escapeHtml(d.websiteValue)}</td>
                <td class="severity-${d.severity}">${(d.severity || '').toUpperCase()}</td>
              </tr>
            `).join('')}
          </table>
        </div>`;
    }
  }

  // Scores
  if (scan) {
    html += `
      <div class="detail-scores">
        ${[[t('score.overall'), scan.overall_score], [t('score.meta'), scan.meta_score], [t('score.content'), scan.content_score], [t('score.technical'), scan.technical_score], [t('score.legal'), scan.legal_score]].map(([label, val]) => `
          <div class="detail-score-card">
            <div class="label">${label}</div>
            <div class="value" style="color:${scoreColor(val || 0)}">${val || 0}</div>
          </div>
        `).join('')}
      </div>`;
  }

  // Tabs
  html += `
    <div class="tabs">
      <button class="tab active" onclick="switchTab(this,'tab-issues')">${t('tab.issues')}</button>
      <button class="tab" onclick="switchTab(this,'tab-legal')">${t('tab.legal')}</button>
      <button class="tab" onclick="switchTab(this,'tab-info')">${t('tab.info')}</button>
      <button class="tab" onclick="switchTab(this,'tab-docs')">${t('tab.docs')}</button>
      <button class="tab" onclick="switchTab(this,'tab-history')">${t('tab.history')}</button>
    </div>`;

  // Issues tab
  html += `<div class="tab-content active" id="tab-issues">`;
  if (scan) {
    const issues = JSON.parse(scan.issues_json || '[]');
    if (issues.length === 0) {
      html += `<div style="text-align:center;padding:40px;color:var(--text-muted)"><div style="font-size:32px;margin-bottom:8px">\u2705</div>${t('issues.noIssues')}</div>`;
    }
    for (const issue of issues) {
      html += `
        <div class="issue-item">
          <span class="issue-severity ${issue.severity}">${issue.severity}</span>
          <div class="issue-title">${escapeHtml(issue.title)}</div>
          <div class="issue-desc">${escapeHtml(issue.description)}</div>
          ${issue.fix ? `<div class="issue-fix">\u2192 ${escapeHtml(issue.fix)}</div>` : ''}
        </div>`;
    }
  } else {
    html += `<div style="text-align:center;padding:40px;color:var(--text-muted)">${t('issues.runScan')}</div>`;
  }
  html += `</div>`;

  // Legal tab
  html += `<div class="tab-content" id="tab-legal">`;
  if (scan) {
    const legal = JSON.parse(scan.legal_json || '{}');
    const cookie = JSON.parse(scan.cookie_json || '{}');
    html += `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px">
        ${[[t('legal.impressum'), scan.has_impressum, legal.impressum?.url], [t('legal.privacy'), scan.has_privacy_policy, legal.privacy?.url], [t('legal.terms'), scan.has_terms_of_service, legal.terms?.url], [t('legal.cookieBanner'), cookie.detected ? 1 : 0, null]].map(([label, found, url]) => `
          <div class="info-card">
            <div class="info-label">${label}</div>
            <div style="font-size:14px;font-weight:700;color:${found ? 'var(--green)' : 'var(--red)'}">${found ? '\u2713 ' + t('legal.found') : '\u2717 ' + t('legal.missing')}</div>
            ${url ? `<a href="${url}" target="_blank" style="font-size:11px;margin-top:4px;display:block">${t('legal.viewPage')} \u2192</a>` : ''}
          </div>
        `).join('')}
      </div>
      ${cookie.detected ? `
        <div class="info-card">
          <div class="info-label">${t('legal.cookieScore')}</div>
          <div style="font-size:24px;font-weight:800;margin:6px 0">${cookie.score || 0}<span style="font-size:12px;color:var(--text-muted)">/100</span></div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge ${cookie.hasRejectAll ? 'badge-ok' : 'badge-fail'}">${t('legal.rejectAll')}</span>
            <span class="badge ${cookie.hasGranularChoices ? 'badge-ok' : 'badge-fail'}">${t('legal.granular')}</span>
            <span class="badge ${cookie.hasNecessaryOnly ? 'badge-ok' : 'badge-fail'}">${t('legal.necessary')}</span>
            <span class="badge ${cookie.hasCookiePolicy ? 'badge-ok' : 'badge-fail'}">${t('legal.cookiePolicy')}</span>
          </div>
        </div>
      ` : ''}`;
  } else {
    html += `<div style="text-align:center;padding:40px;color:var(--text-muted)">${t('legal.runScan')}</div>`;
  }
  html += `</div>`;

  // Company Info tab
  html += `<div class="tab-content" id="tab-info">`;
  if (data.details) {
    const d = data.details;
    html += `
      <div class="info-grid">
        ${[[t('info.companyNumber'), d.company_number], [t('info.companyType'), d.company_type], [t('info.jurisdiction'), d.jurisdiction], [t('info.address'), d.registered_address], [t('info.incDate'), d.incorporation_date], [t('info.vat'), d.vat_number], [t('info.email'), d.registered_email], [t('info.phone'), d.registered_phone], [t('info.director'), d.lead_director], [t('info.directorTitle'), d.lead_director_title], [t('info.localDirector'), d.local_director], [t('info.shareCapital'), d.share_capital], [t('info.shareType'), d.share_type], [t('info.shareCount'), d.share_count]].map(([label, val]) => `
          <div class="info-card">
            <div class="info-label">${label}</div>
            <div class="info-value">${val || '<span class="info-empty">' + t('info.notSpecified') + '</span>'}</div>
          </div>
        `).join('')}
      </div>
      <div class="mt-4"><button class="btn btn-sm" onclick="showEditDetailsModal(${data.id}, ${JSON.stringify(data.details).replace(/"/g, '&quot;')})">${t('info.editDetails')}</button></div>`;
  } else {
    html += `
      <div style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:32px;margin-bottom:8px">\uD83C\uDFE2</div>
        <div style="font-size:15px;font-weight:600;margin-bottom:4px">${t('info.noDetails')}</div>
        <div style="font-size:12px;margin-bottom:16px">${t('info.noDetailsDesc')}</div>
        <button class="btn btn-primary" onclick="showEditDetailsModal(${data.id})">${t('info.addDetails')}</button>
      </div>`;
  }
  html += `</div>`;

  // Documents tab
  html += `<div class="tab-content" id="tab-docs">`;
  html += `<div style="margin-bottom:14px"><button class="btn btn-primary btn-sm" onclick="showUploadModal(${data.id})">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    ${t('docs.upload')}</button></div>`;
  if (data.documents && data.documents.length > 0) {
    for (const doc of data.documents) {
      html += `
        <div class="doc-item">
          <div>
            <div class="doc-name">${escapeHtml(doc.file_name)}</div>
            <div class="doc-meta">${escapeHtml(doc.category)} \u00B7 ${formatBytes(doc.file_size)}</div>
          </div>
          <div style="display:flex;gap:6px">
            <a class="btn btn-sm" href="/uploads/${data.id}/${doc.file_name}" target="_blank">${t('docs.view')}</a>
            <button class="btn btn-sm btn-danger" onclick="deleteDoc(${doc.id},${data.id})">${t('docs.delete')}</button>
          </div>
        </div>`;
    }
  } else {
    html += `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px">${t('docs.noDocs')}</div>`;
  }
  html += `</div>`;

  // Scan History tab
  html += `<div class="tab-content" id="tab-history">`;
  if (data.scanHistory && data.scanHistory.length > 0) {
    for (const s of data.scanHistory) {
      html += `
        <div class="doc-item">
          <div>
            <div class="doc-name">${t('history.score')}: ${s.overall_score || '\u2014'}/100 <span style="font-size:11px;color:var(--text-muted)">(${s.status})</span></div>
            <div class="doc-meta">${new Date(s.scanned_at).toLocaleString(getLang() === 'de' ? 'de-DE' : 'en-US')} \u00B7 ${s.pages_crawled || 0} ${t('card.pagesCrawled')}</div>
          </div>
          <div style="font-size:11px;color:var(--text-subtle)">#${s.id}</div>
        </div>`;
    }
  } else {
    html += `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:12px">${t('history.noHistory')}</div>`;
  }
  html += `</div>`;

  app.innerHTML = html;
}

function switchTab(btn, tabId) {
  btn.parentElement.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
}

// ==================== Actions ====================
async function triggerScan(companyId) {
  showToast(t('toast.scanStarted'), 'info');
  const result = await api(`/api/companies/${companyId}/scan`, { method: 'POST' });
  if (!result) return;

  const poll = setInterval(async () => {
    const scan = await api(`/api/companies/${companyId}/scan/latest`);
    if (scan && (scan.status === 'completed' || scan.status === 'failed')) {
      clearInterval(poll);
      if (scan.status === 'completed') {
        showToast(`${t('toast.scanComplete')} ${scan.overall_score}/100`);
      } else {
        showToast(t('toast.scanFailed'), 'error');
      }
      if (currentPage === 'company-detail') renderCompanyDetail(companyId);
      else navigate(currentPage);
    }
  }, 5000);
}

async function scanAll() {
  showToast(t('toast.scanAllStarted'), 'info');
  const result = await api('/api/scan-all', { method: 'POST' });
  if (result) showToast(`${result.scans?.length || 0} ${t('toast.scansQueued')}`);
}

async function deleteCompany(id, name) {
  if (!confirm(`"${name}" ${t('confirm.delete')}`)) return;
  await api(`/api/companies/${id}`, { method: 'DELETE' });
  showToast(`${name} ${t('toast.companyDeleted')}`);
  navigate(currentPage);
}

async function deleteDoc(docId, companyId) {
  if (!confirm(t('confirm.deleteDoc'))) return;
  await api(`/api/documents/${docId}`, { method: 'DELETE' });
  showToast(t('toast.docDeleted'));
  renderCompanyDetail(companyId);
}

async function showFixPrompt(companyId) {
  const data = await api(`/api/companies/${companyId}/fix-prompt`);
  if (!data) return;
  showModal(`
    <h2>${t('fix.title')}</h2>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:14px">${t('fix.desc')}</p>
    <div style="margin-bottom:14px;display:flex;gap:6px;flex-wrap:wrap">
      <span class="badge badge-fail">${data.critical || 0} ${t('fix.critical')}</span>
      <span class="badge" style="background:var(--yellow-muted);color:var(--yellow)">${data.warnings || 0} ${t('fix.warnings')}</span>
      <span style="font-size:11px;color:var(--text-muted);align-self:center">${data.issueCount || 0} ${t('fix.totalIssues')} \u00B7 ${(data.prompt || '').length} ${t('fix.characters')}</span>
    </div>
    <div class="prompt-box" id="prompt-text">${escapeHtml(data.prompt || t('fix.noPrompt'))}</div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">${t('fix.close')}</button>
      <button class="btn btn-primary" onclick="copyPrompt()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        ${t('fix.copy')}
      </button>
    </div>
  `);
}

function copyPrompt() {
  const text = document.getElementById('prompt-text').textContent;
  navigator.clipboard.writeText(text).then(() => showToast(t('fix.copied')));
}

// ==================== Modals ====================
function showAddCompanyModal() {
  showModal(`
    <h2>${t('modal.addCompany')}</h2>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${t('modal.addCompany.desc')}</p>
    <form onsubmit="addCompany(event)">
      <div class="form-group">
        <label class="form-label">${t('modal.companyName')} *</label>
        <input class="form-input" id="add-name" required placeholder="${t('ph.companyName')}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('modal.websiteUrl')} *</label>
        <input class="form-input" id="add-url" required placeholder="${t('ph.url')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('modal.sector')}</label>
          <input class="form-input" id="add-sector" placeholder="${t('ph.sector')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('modal.platform')}</label>
          <input class="form-input" id="add-platform" placeholder="${t('ph.platform')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('modal.description')}</label>
        <textarea class="form-input" id="add-desc" rows="3" placeholder="${t('ph.description')}"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('modal.cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('modal.addAndScan')}</button>
      </div>
    </form>
  `);
}

async function addCompany(e) {
  e.preventDefault();
  const result = await api('/api/companies', {
    method: 'POST',
    body: JSON.stringify({
      name: document.getElementById('add-name').value,
      url: document.getElementById('add-url').value,
      sector: document.getElementById('add-sector').value,
      hosting_platform: document.getElementById('add-platform').value,
      description: document.getElementById('add-desc').value
    })
  });
  if (result) {
    closeModal();
    showToast(`${result.name || 'Company'} ${t('toast.companyAdded')}`);
    navigate('home');
    triggerScan(result.id);
  }
}

function showEditCompanyModal(data) {
  showModal(`
    <h2>${t('modal.editCompany')}</h2>
    <form onsubmit="editCompany(event, ${data.id})">
      <div class="form-group">
        <label class="form-label">${t('modal.companyName')}</label>
        <input class="form-input" id="edit-name" value="${escapeHtml(data.name)}">
      </div>
      <div class="form-group">
        <label class="form-label">${t('modal.websiteUrl')}</label>
        <input class="form-input" id="edit-url" value="${escapeHtml(data.url)}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('modal.sector')}</label>
          <input class="form-input" id="edit-sector" value="${escapeHtml(data.sector || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('modal.platform')}</label>
          <input class="form-input" id="edit-platform" value="${escapeHtml(data.hosting_platform || '')}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${t('modal.description')}</label>
        <textarea class="form-input" id="edit-desc" rows="3">${escapeHtml(data.description || '')}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('modal.cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('modal.save')}</button>
      </div>
    </form>
  `);
}

async function editCompany(e, id) {
  e.preventDefault();
  await api(`/api/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: document.getElementById('edit-name').value,
      url: document.getElementById('edit-url').value,
      sector: document.getElementById('edit-sector').value,
      hosting_platform: document.getElementById('edit-platform').value,
      description: document.getElementById('edit-desc').value
    })
  });
  closeModal();
  showToast(t('toast.companyUpdated'));
  renderCompanyDetail(id);
}

function showUploadModal(companyId) {
  showModal(`
    <h2>${t('modal.uploadDoc')}</h2>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${t('modal.uploadDoc.desc')}</p>
    <form id="upload-form" enctype="multipart/form-data">
      <div class="form-group">
        <label class="form-label">${t('modal.file')}</label>
        <input type="file" class="form-input" id="upload-file" required style="padding:8px">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${t('modal.category')}</label>
          <select class="form-input" id="upload-category">
            <option value="incorporation">${t('cat.incorporation')}</option>
            <option value="governance">${t('cat.governance')}</option>
            <option value="tax">${t('cat.tax')}</option>
            <option value="legal">${t('cat.legal')}</option>
            <option value="financial">${t('cat.financial')}</option>
            <option value="compliance">${t('cat.compliance')}</option>
            <option value="other">${t('cat.other')}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${t('modal.docDesc')}</label>
          <input class="form-input" id="upload-desc" placeholder="${t('ph.docDesc')}">
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('modal.cancel')}</button>
        <button type="button" class="btn btn-primary" onclick="uploadDoc(${companyId})">${t('modal.uploadBtn')}</button>
      </div>
    </form>
  `);
}

async function uploadDoc(companyId) {
  const fileInput = document.getElementById('upload-file');
  if (!fileInput.files[0]) return;
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('category', document.getElementById('upload-category').value);
  formData.append('description', document.getElementById('upload-desc').value);
  await fetch(`/api/companies/${companyId}/documents`, { method: 'POST', body: formData });
  closeModal();
  showToast(t('toast.docUploaded'));
  renderCompanyDetail(companyId);
}

function showEditDetailsModal(companyId, existing) {
  const d = existing || {};
  showModal(`
    <h2>${t('modal.companyDetails')}</h2>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${t('modal.companyDetails.desc')}</p>
    <form onsubmit="saveDetails(event, ${companyId})">
      <div class="form-row">
        <div class="form-group"><label class="form-label">${t('info.companyNumber')}</label><input class="form-input" id="det-number" value="${escapeHtml(d.company_number || '')}"></div>
        <div class="form-group"><label class="form-label">${t('info.companyType')}</label><input class="form-input" id="det-type" value="${escapeHtml(d.company_type || '')}" placeholder="${t('ph.companyType')}"></div>
      </div>
      <div class="form-group"><label class="form-label">${t('info.address')}</label><input class="form-input" id="det-address" value="${escapeHtml(d.registered_address || '')}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">${t('info.jurisdiction')}</label><input class="form-input" id="det-jurisdiction" value="${escapeHtml(d.jurisdiction || '')}"></div>
        <div class="form-group"><label class="form-label">${t('info.incDate')}</label><input class="form-input" id="det-incdate" value="${escapeHtml(d.incorporation_date || '')}" placeholder="${t('ph.incDate')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">${t('info.vat')}</label><input class="form-input" id="det-vat" value="${escapeHtml(d.vat_number || '')}"></div>
        <div class="form-group"><label class="form-label">${t('info.email')}</label><input class="form-input" id="det-email" value="${escapeHtml(d.registered_email || '')}"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">${t('info.director')}</label><input class="form-input" id="det-director" value="${escapeHtml(d.lead_director || '')}"></div>
        <div class="form-group"><label class="form-label">${t('info.directorTitle')}</label><input class="form-input" id="det-dirtitle" value="${escapeHtml(d.lead_director_title || '')}" placeholder="${t('ph.directorTitle')}"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('modal.cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('modal.save')}</button>
      </div>
    </form>
  `);
}

async function saveDetails(e, companyId) {
  e.preventDefault();
  await api(`/api/companies/${companyId}/details`, {
    method: 'PUT',
    body: JSON.stringify({
      company_number: document.getElementById('det-number').value,
      company_type: document.getElementById('det-type').value,
      registered_address: document.getElementById('det-address').value,
      jurisdiction: document.getElementById('det-jurisdiction').value,
      incorporation_date: document.getElementById('det-incdate').value,
      vat_number: document.getElementById('det-vat').value,
      registered_email: document.getElementById('det-email').value,
      lead_director: document.getElementById('det-director').value,
      lead_director_title: document.getElementById('det-dirtitle').value
    })
  });
  closeModal();
  showToast(t('toast.detailsSaved'));
  renderCompanyDetail(companyId);
}

// ==================== Modal Helpers ====================
function showModal(content) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  overlay.innerHTML = `<div class="modal">${content}</div>`;
  document.body.appendChild(overlay);
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.remove();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', () => {
  updateSidebarLanguage();
  navigate('home');
});
