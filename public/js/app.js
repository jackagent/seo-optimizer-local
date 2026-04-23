// ==================== State ====================
let currentPage = 'home';
let currentCompanyId = null;
let companies = [];
let stats = {};
let discrepancies = [];
let currentYoutubeId = null;
let currentArticleId = null;
let currentCampaignId = null;

// ==================== Language ====================
function switchLanguage() {
  const newLang = toggleLang();
  updateSidebarLanguage();
  updateHeaderLanguage();
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

  const navMap = {
    'home': 'nav.commandCenter',
    'dashboard': 'nav.portfolioGrid',
    'companies': 'nav.companies',
    'scan-all': 'nav.scanAll',
    'discrepancies': 'nav.discrepancies',
    'youtube': 'nav.youtube',
    'articles': 'nav.articles',
    'outreach': 'nav.outreach',
    'settings': 'nav.settings'
  };

  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    const page = item.getAttribute('data-page');
    const key = navMap[page];
    if (key) {
      const svg = item.querySelector('svg');
      const badge = item.querySelector('.nav-badge');
      item.textContent = '';
      if (svg) item.appendChild(svg);
      item.appendChild(document.createTextNode(' ' + t(key)));
      if (badge) item.appendChild(badge);
    }
  });

  const sectionLabels = document.querySelectorAll('.nav-section-label');
  const sectionKeys = ['nav.overview', 'nav.management', 'nav.contentTools', 'nav.analysis', 'nav.system'];
  sectionLabels.forEach((el, i) => {
    if (sectionKeys[i]) el.textContent = t(sectionKeys[i]);
  });

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
    'company-detail': ['page.companyDetail', ''],
    youtube: ['page.youtube', 'page.youtube.sub'],
    'youtube-detail': ['page.youtube', ''],
    articles: ['page.articles', 'page.articles.sub'],
    'article-detail': ['page.articles', ''],
    outreach: ['page.outreach', 'page.outreach.sub'],
    'outreach-detail': ['page.outreach', ''],
    settings: ['page.settings', 'page.settings.sub']
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
  document.getElementById('sidebar').classList.remove('open');

  switch (page) {
    case 'home': renderHome(); break;
    case 'dashboard': renderDashboard(); break;
    case 'companies': renderCompanies(); break;
    case 'company-detail': renderCompanyDetail(data); break;
    case 'discrepancies': renderDiscrepancies(); break;
    case 'youtube': renderYouTube(); break;
    case 'youtube-detail': renderYouTubeDetail(data); break;
    case 'articles': renderArticles(); break;
    case 'article-detail': renderArticleDetail(data); break;
    case 'outreach': renderOutreach(); break;
    case 'outreach-detail': renderOutreachDetail(data); break;
    case 'settings': renderSettings(); break;
    default: renderHome();
  }
}

// ==================== API Helpers ====================
async function api(url, opts = {}) {
  try {
    const fetchOpts = { ...opts };
    if (!opts.body || typeof opts.body === 'string') {
      fetchOpts.headers = { 'Content-Type': 'application/json', ...opts.headers };
    }
    const res = await fetch(url, fetchOpts);
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errBody}`);
    }
    return res.json();
  } catch (err) {
    console.error('API Error:', url, err);
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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast(t('toast.copied')));
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

  const badge = document.getElementById('discrepancy-badge');
  const totalDisc = discrepancies.reduce((sum, d) => sum + (d.discrepancies?.length || 0), 0);
  if (totalDisc > 0) { badge.textContent = totalDisc; badge.style.display = 'inline'; }
  else { badge.style.display = 'none'; }

  if (companies.length === 0) {
    app.innerHTML = renderOnboarding();
    return;
  }

  let html = '';

  html += `
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">${t('stats.portfolioCompanies')}</div><div class="stat-value">${stats.totalCompanies}</div></div>
      <div class="stat-card"><div class="stat-label">${t('stats.avgScore')}</div><div class="stat-value ${stats.avgScore >= 70 ? 'good' : stats.avgScore < 50 ? 'alert' : ''}">${stats.avgScore}<span class="suffix">/100</span></div></div>
      <div class="stat-card"><div class="stat-label">${t('stats.criticalIssues')}</div><div class="stat-value ${stats.criticalIssues > 0 ? 'alert' : ''}">${stats.criticalIssues}</div></div>
      <div class="stat-card"><div class="stat-label">${t('stats.scansToday')}</div><div class="stat-value">${stats.scansToday}</div></div>
    </div>`;

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

  // Tutorial banner
  const hasMeridian = companies.some(c => c.name && c.name.includes('Meridian'));
  if (hasMeridian) {
    html += `
      <div class="tutorial-banner">
        <strong>${t('tutorial.title')}</strong>
        <p style="margin:4px 0 0;font-size:12px;color:var(--text-muted)">${t('tutorial.desc')}</p>
      </div>`;
  }

  // Company cards
  html += `<div class="company-grid">`;
  for (const c of companies) {
    const scan = c.latestScan;
    const score = scan ? scan.overall_score : 0;
    const scannedAt = scan ? scan.scanned_at : null;
    const pagesCrawled = scan ? scan.pages_crawled : 0;
    html += `
      <div class="company-card" onclick="navigate('company-detail',${c.id})">
        <div class="company-card-header">
          <div>
            <div class="company-name">${escapeHtml(c.name)}</div>
            <div class="company-url">${escapeHtml(c.url)}</div>
          </div>
          ${scoreGaugeSVG(score, 52)}
        </div>
        <div class="company-card-body">
          <div class="company-meta">
            ${c.sector ? `<span class="tag">${escapeHtml(c.sector)}</span>` : ''}
            ${c.hosting_platform ? `<span class="tag">${escapeHtml(c.hosting_platform)}</span>` : ''}
          </div>
          <div class="company-stats">
            <span>${scannedAt ? `${t('card.scanned')} ${timeAgo(scannedAt)}` : t('card.noScan')}</span>
            ${pagesCrawled ? `<span>${pagesCrawled} ${t('card.pagesCrawled')}</span>` : ''}
          </div>
        </div>
      </div>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

function renderOnboarding() {
  return `
    <div class="onboarding">
      <div class="onboarding-hero">
        <h1>${t('onboard.welcome')}</h1>
        <p>${t('onboard.subtitle')}</p>
      </div>
      <div class="onboarding-features">
        <div class="onboarding-feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <h3>${t('onboard.feature1.title')}</h3>
          <p>${t('onboard.feature1.desc')}</p>
        </div>
        <div class="onboarding-feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3>${t('onboard.feature2.title')}</h3>
          <p>${t('onboard.feature2.desc')}</p>
        </div>
        <div class="onboarding-feature">
          <div class="feature-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3>${t('onboard.feature3.title')}</h3>
          <p>${t('onboard.feature3.desc')}</p>
        </div>
      </div>
      <div class="onboarding-actions">
        <button class="btn btn-primary btn-lg" onclick="showAddCompanyModal()">${t('onboard.addFirst')}</button>
        <button class="btn btn-lg" onclick="loadDemo()">${t('onboard.tryDemo')}</button>
      </div>
    </div>`;
}

async function loadDemo() {
  showToast(t('toast.demoCreated'), 'info');
  await api('/api/seed-demo', { method: 'POST' });
  navigate('home');
}

// ==================== Dashboard (Portfolio Grid) ====================
async function renderDashboard() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';
  const data = await api('/api/dashboard/companies');
  if (!data || data.length === 0) {
    app.innerHTML = `<div class="empty-state"><div class="empty-title">${t('empty.noDashboard')}</div><div class="empty-desc">${t('empty.noDashboardDesc')}</div></div>`;
    return;
  }
  let html = `<div class="portfolio-grid">`;
  for (const c of data) {
    const score = c.latestScan ? c.latestScan.overall_score : 0;
    html += `
      <div class="portfolio-card" onclick="navigate('company-detail',${c.id})">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <div style="font-weight:700;font-size:14px">${escapeHtml(c.name)}</div>
          ${scoreGaugeSVG(score, 44)}
        </div>
        <div style="font-size:11px;color:var(--text-muted)">${escapeHtml(c.url)}</div>
        ${c.sector ? `<div style="margin-top:6px"><span class="tag">${escapeHtml(c.sector)}</span></div>` : ''}
      </div>`;
  }
  html += `</div>`;
  app.innerHTML = html;
}

// ==================== Companies List ====================
async function renderCompanies() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';
  const data = await api('/api/dashboard/companies');
  if (!data || data.length === 0) {
    app.innerHTML = `<div class="empty-state"><div class="empty-title">${t('empty.noCompanies')}</div><div class="empty-desc">${t('empty.noCompaniesDesc')}</div></div>`;
    return;
  }
  let html = `<div class="companies-list">`;
  for (const c of data) {
    html += `
      <div class="company-row" onclick="navigate('company-detail',${c.id})">
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">${escapeHtml(c.name)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(c.url)} ${c.sector ? `\u00B7 ${escapeHtml(c.sector)}` : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-weight:700;color:${scoreColor(c.latestScan ? c.latestScan.overall_score : 0)}">${c.latestScan ? c.latestScan.overall_score : '\u2014'}</div>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteCompany(${c.id},'${escapeHtml(c.name)}')">\u2717</button>
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
  const data = await api('/api/dashboard/discrepancies');
  if (!data || data.length === 0) {
    app.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px;margin-bottom:12px">\u2705</div>
        <div class="empty-title">${t('disc.noDiscrepancies')}</div>
        <div class="empty-desc">${t('disc.allMatch')}</div>
      </div>`;
    return;
  }
  let html = `<div class="discrepancy-banner">`;
  for (const item of data) {
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

  if (scan) {
    html += `
      <div class="detail-scores">
        ${[[t('score.overall'), scan.overall_score], [t('score.meta'), scan.meta_score], [t('score.content'), scan.content_score], [t('score.technical'), scan.technical_score], [t('score.legal'), scan.legal_score]].map(([label, val]) => `
          <div class="detail-score-card"><div class="label">${label}</div><div class="value" style="color:${scoreColor(val || 0)}">${val || 0}</div></div>
        `).join('')}
      </div>`;
  }

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
          <div class="info-card"><div class="info-label">${label}</div><div class="info-value">${val || '<span class="info-empty">' + t('info.notSpecified') + '</span>'}</div></div>
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
          <div><div class="doc-name">${escapeHtml(doc.file_name)}</div><div class="doc-meta">${escapeHtml(doc.category)} \u00B7 ${formatBytes(doc.file_size)}</div></div>
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
      if (scan.status === 'completed') showToast(`${t('toast.scanComplete')} ${scan.overall_score}/100`);
      else showToast(t('toast.scanFailed'), 'error');
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

// ==================== YouTube SEO ====================
async function renderYouTube() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const [analyses, companiesData] = await Promise.all([
    api('/api/youtube'),
    api('/api/companies')
  ]);

  let html = `
    <div class="feature-header">
      <div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px">${t('yt.title')}</h2>
        <p style="font-size:13px;color:var(--text-muted)">${t('yt.subtitle')}</p>
      </div>
    </div>

    <div class="feature-form" style="margin-bottom:24px">
      <div style="display:flex;gap:8px;align-items:end;flex-wrap:wrap">
        <div class="form-group" style="flex:1;min-width:280px;margin-bottom:0">
          <label class="form-label">YouTube URL</label>
          <input class="form-input" id="yt-url" placeholder="${t('yt.urlPlaceholder')}">
        </div>
        <div class="form-group" style="width:200px;margin-bottom:0">
          <label class="form-label">${t('yt.companyLink')} <span style="color:var(--text-muted);font-size:10px">(${t('yt.optional')})</span></label>
          <select class="form-input" id="yt-company">
            <option value="">—</option>
            ${(companiesData || []).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="yt-analyze-btn" onclick="analyzeYouTube()" style="margin-bottom:0">${t('yt.analyze')}</button>
      </div>
    </div>`;

  // History
  html += `<h3 style="font-size:15px;font-weight:700;margin-bottom:12px">${t('yt.history')}</h3>`;
  if (!analyses || analyses.length === 0) {
    html += `
      <div class="empty-state" style="padding:40px">
        <div style="font-size:40px;margin-bottom:8px">\uD83C\uDFAC</div>
        <div class="empty-title">${t('yt.noHistory')}</div>
        <div class="empty-desc">${t('yt.noHistoryDesc')}</div>
      </div>`;
  } else {
    html += `<div class="companies-list">`;
    for (const a of analyses) {
      html += `
        <div class="company-row" onclick="navigate('youtube-detail',${a.id})">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px">${escapeHtml(a.video_title || a.youtube_url)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(a.channel_name || '')} \u00B7 ${timeAgo(a.created_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-weight:700;color:${scoreColor(a.seo_score || 0)}">${a.seo_score || '\u2014'}</div>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteYouTube(${a.id})">\u2717</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  app.innerHTML = html;
}

async function analyzeYouTube() {
  const url = document.getElementById('yt-url').value.trim();
  if (!url) return;
  const companyId = document.getElementById('yt-company').value;
  const btn = document.getElementById('yt-analyze-btn');
  btn.textContent = t('yt.analyzing');
  btn.disabled = true;

  const result = await api('/api/youtube/analyze', {
    method: 'POST',
    body: JSON.stringify({ url, company_id: companyId || null })
  });

  btn.textContent = t('yt.analyze');
  btn.disabled = false;

  if (result) {
    showToast(t('toast.youtubeAnalyzed'));
    navigate('youtube-detail', result.id);
  }
}

async function renderYouTubeDetail(id) {
  currentYoutubeId = id;
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';
  let data = await api(`/api/youtube/${id}`);
  if (!data) return;

  // Poll until analysis is completed (runs in background)
  if (data.status === 'analyzing' || data.status === 'pending') {
    app.innerHTML = `<div style="text-align:center;padding:60px"><div class="spinner" style="margin:0 auto 16px"></div><div style="font-size:15px;font-weight:700">${t('yt.analyzing')}</div><div style="font-size:12px;color:var(--text-muted);margin-top:6px">${t('yt.analyzingDesc') || 'Analysiere Video-Metadaten, Tags und Engagement...'}</div></div>`;
    let attempts = 0;
    while (attempts < 30) { // max 60 seconds
      await new Promise(r => setTimeout(r, 2000));
      data = await api(`/api/youtube/${id}`);
      if (!data || data.status === 'completed' || data.status === 'failed') break;
      attempts++;
    }
    if (!data || data.status === 'failed') {
      app.innerHTML = `<div style="text-align:center;padding:60px"><div style="font-size:40px;margin-bottom:8px">\u26A0\uFE0F</div><div style="font-weight:700">${t('yt.analysisFailed') || 'Analyse fehlgeschlagen'}</div><div style="margin-top:12px"><button class="btn" onclick="navigate('youtube')">${t('yt.backToList')}</button></div></div>`;
      return;
    }
  }

  // Parse JSON fields
  const tags = JSON.parse(data.tags_json || '[]');
  const issues = JSON.parse(data.issues_json || '[]');
  const recommendations = JSON.parse(data.recommendations_json || '[]');
  const scores = JSON.parse(data.analysis_data_json || '{}');

  document.getElementById('header-title').textContent = data.video_title || 'YouTube Analysis';
  document.getElementById('header-breadcrumb').textContent = '';

  let html = `
    <div class="detail-back" onclick="navigate('youtube')" style="margin-bottom:16px;cursor:pointer;font-size:13px;color:var(--text-muted)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      ${t('yt.backToList')}
    </div>

    <div style="margin-bottom:20px">
      <h1 style="font-size:20px;font-weight:800;margin-bottom:6px">${escapeHtml(data.video_title || '')}</h1>
      <p style="font-size:13px;color:var(--text-muted)">${escapeHtml(data.channel_name || '')} \u00B7 <a href="${escapeHtml(data.youtube_url)}" target="_blank" style="color:var(--accent-400)">YouTube \u2192</a></p>
    </div>

    ${data.thumbnail_url ? `<div style="margin-bottom:20px"><img src="${escapeHtml(data.thumbnail_url)}" style="width:100%;max-width:640px;border-radius:8px" alt="Thumbnail"></div>` : ''}

    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card"><div class="stat-label">${t('yt.seoScore')}</div><div class="stat-value" style="color:${scoreColor(data.seo_score || 0)}">${data.seo_score || 0}</div></div>
      <div class="stat-card"><div class="stat-label">${t('yt.views')}</div><div class="stat-value">${(data.view_count || 0).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">${t('yt.likes')}</div><div class="stat-value">${(data.like_count || 0).toLocaleString()}</div></div>
      <div class="stat-card"><div class="stat-label">${t('yt.comments')}</div><div class="stat-value">${(data.comment_count || 0).toLocaleString()}</div></div>
    </div>`;

  // Score breakdown
  if (scores && Object.keys(scores).length > 0) {
    html += `
      <div class="detail-scores" style="margin-bottom:20px">
        ${[['yt.titleScore', scores.title], ['yt.descScore', scores.description], ['yt.tagScore', scores.tags], ['yt.engagementScore', scores.engagement]].filter(([, val]) => val !== undefined).map(([key, val]) => `
          <div class="detail-score-card"><div class="label">${t(key)}</div><div class="value" style="color:${scoreColor(val || 0)}">${val || 0}</div></div>
        `).join('')}
      </div>`;
  }

  // Description preview
  if (data.video_description) {
    const desc = data.video_description.length > 300 ? data.video_description.substring(0, 300) + '...' : data.video_description;
    html += `<div class="info-card" style="margin-bottom:16px"><div class="info-label">${t('yt.description')}</div><div style="font-size:13px;color:var(--text-secondary);margin-top:6px;white-space:pre-wrap">${escapeHtml(desc)}</div></div>`;
  }

  // Duration and publish date
  html += `<div style="display:flex;gap:16px;margin-bottom:16px;font-size:13px;color:var(--text-muted)">`;
  if (data.duration) html += `<span>\u23F1 ${escapeHtml(data.duration)}</span>`;
  if (data.published_at) html += `<span>\uD83D\uDCC5 ${escapeHtml(data.published_at.split('T')[0])}</span>`;
  html += `</div>`;

  // Tags
  if (tags && tags.length > 0) {
    html += `<div class="info-card" style="margin-bottom:16px"><div class="info-label">${t('yt.tags')} (${tags.length})</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div></div>`;
  }

  // Issues
  if (issues && issues.length > 0) {
    html += `<h3 style="font-size:15px;font-weight:700;margin-bottom:10px">${t('yt.issues')}</h3>`;
    for (const issue of issues) {
      html += `
        <div class="issue-item">
          <span class="issue-severity ${issue.severity || 'warning'}">${issue.severity || 'warning'}</span>
          <div class="issue-title">${escapeHtml(issue.title)}</div>
          <div class="issue-desc">${escapeHtml(issue.description)}</div>
          ${issue.fix ? `<div class="issue-fix">\u2192 ${escapeHtml(issue.fix)}</div>` : ''}
        </div>`;
    }
  }

  // Recommendations
  if (recommendations && recommendations.length > 0) {
    html += `<h3 style="font-size:15px;font-weight:700;margin:16px 0 10px">${t('yt.recommendations')}</h3>`;
    for (const rec of recommendations) {
      html += `<div class="issue-item"><div class="issue-fix">\u2192 ${escapeHtml(rec)}</div></div>`;
    }
  }

  app.innerHTML = html;
}

async function deleteYouTube(id) {
  if (!confirm(t('confirm.deleteYoutube'))) return;
  await api(`/api/youtube/${id}`, { method: 'DELETE' });
  showToast(t('toast.youtubeDeleted'));
  navigate('youtube');
}

// ==================== Article Generator ====================
async function renderArticles() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const [articles, companiesData, settings] = await Promise.all([
    api('/api/articles'),
    api('/api/companies'),
    api('/api/settings')
  ]);

  const hasApiKey = settings && settings.llm_api_key;

  let html = `
    <div class="feature-header">
      <div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px">${t('art.title')}</h2>
        <p style="font-size:13px;color:var(--text-muted)">${t('art.subtitle')}</p>
      </div>
    </div>`;

  if (!hasApiKey) {
    html += `
      <div class="info-card" style="text-align:center;padding:32px;margin-bottom:24px;border:1px solid var(--yellow)">
        <div style="font-size:32px;margin-bottom:8px">\uD83D\uDD11</div>
        <div style="font-weight:700;margin-bottom:4px">${t('art.needsApiKey')}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${t('art.needsApiKeyDesc')}</div>
        <button class="btn btn-primary" onclick="navigate('settings')">${t('art.goToSettings')}</button>
      </div>`;
  } else {
    html += `
      <div class="feature-form" style="margin-bottom:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">${t('art.topic')} *</label>
            <input class="form-input" id="art-topic" placeholder="${t('art.topicPlaceholder')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('art.keywords')}</label>
            <input class="form-input" id="art-keywords" placeholder="${t('art.keywordsPlaceholder')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('art.platform')}</label>
            <select class="form-input" id="art-platform">
              <option value="blog">${t('art.platformBlog')}</option>
              <option value="linkedin">${t('art.platformLinkedin')}</option>
              <option value="medium">${t('art.platformMedium')}</option>
              <option value="newsletter">${t('art.platformNewsletter')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('art.tone')}</label>
            <select class="form-input" id="art-tone">
              <option value="professional">${t('art.toneProfessional')}</option>
              <option value="conversational">${t('art.toneConversational')}</option>
              <option value="academic">${t('art.toneAcademic')}</option>
              <option value="persuasive">${t('art.tonePersuasive')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('art.language')}</label>
            <select class="form-input" id="art-lang">
              <option value="de" ${getLang() === 'de' ? 'selected' : ''}>${t('art.langDe')}</option>
              <option value="en" ${getLang() === 'en' ? 'selected' : ''}>${t('art.langEn')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('art.companyContext')}</label>
            <select class="form-input" id="art-company">
              <option value="">— ${t('yt.optional')} —</option>
              ${(companiesData || []).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-top:12px">
          <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
            <input type="checkbox" id="art-images" checked>
            ${t('art.includeImages')}
          </label>
          <span style="font-size:11px;color:var(--text-muted)">${t('art.includeImagesDesc')}</span>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" id="art-generate-btn" onclick="generateArticle()">${t('art.generate')}</button>
        </div>
      </div>`;
  }

  // History
  html += `<h3 style="font-size:15px;font-weight:700;margin-bottom:12px">${t('art.history')}</h3>`;
  if (!articles || articles.length === 0) {
    html += `
      <div class="empty-state" style="padding:40px">
        <div style="font-size:40px;margin-bottom:8px">\uD83D\uDCDD</div>
        <div class="empty-title">${t('art.noHistory')}</div>
        <div class="empty-desc">${t('art.noHistoryDesc')}</div>
      </div>`;
  } else {
    html += `<div class="companies-list">`;
    for (const a of articles) {
      html += `
        <div class="company-row" onclick="navigate('article-detail',${a.id})">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px">${escapeHtml(a.title)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(a.platform || '')} \u00B7 ${a.word_count || 0} ${t('art.wordCount')} \u00B7 ${timeAgo(a.created_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-weight:700;color:${scoreColor(a.seo_score || 0)}">${a.seo_score || '\u2014'}</div>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteArticle(${a.id})">\u2717</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  app.innerHTML = html;
}

async function generateArticle() {
  const topic = document.getElementById('art-topic').value.trim();
  if (!topic) return;
  const btn = document.getElementById('art-generate-btn');
  btn.textContent = t('art.generating');
  btn.disabled = true;

  const result = await api('/api/articles/generate', {
    method: 'POST',
    body: JSON.stringify({
      topic,
      keywords: document.getElementById('art-keywords').value,
      platform: document.getElementById('art-platform').value,
      tone: document.getElementById('art-tone').value,
      language: document.getElementById('art-lang').value,
      company_id: document.getElementById('art-company').value || null,
      include_images: document.getElementById('art-images').checked
    })
  });

  btn.textContent = t('art.generate');
  btn.disabled = false;

  if (result) {
    showToast(t('toast.articleGenerated'));
    navigate('article-detail', result.id);
  }
}

async function renderArticleDetail(id) {
  currentArticleId = id;
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';
  const data = await api(`/api/articles/${id}`);
  if (!data) return;

  document.getElementById('header-title').textContent = data.title || 'Article';
  document.getElementById('header-breadcrumb').textContent = '';

  const readTime = Math.ceil((data.word_count || 0) / 200);

  let html = `
    <div class="detail-back" onclick="navigate('articles')" style="margin-bottom:16px;cursor:pointer;font-size:13px;color:var(--text-muted)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      ${t('art.backToList')}
    </div>

    <div style="margin-bottom:20px">
      <h1 style="font-size:22px;font-weight:800;margin-bottom:8px">${escapeHtml(data.title)}</h1>
      <div style="display:flex;gap:12px;font-size:12px;color:var(--text-muted);flex-wrap:wrap">
        <span>${escapeHtml(data.platform || '')}</span>
        <span>${data.word_count || 0} ${t('art.wordCount')}</span>
        <span>~${readTime} ${t('art.min')} ${t('art.readTime')}</span>
        <span style="color:${scoreColor(data.seo_score || 0)};font-weight:700">${t('art.seoScore')}: ${data.seo_score || 0}</span>
      </div>
    </div>`;

  // Hero image
  if (data.hero_image_url) {
    html += `<div style="margin-bottom:20px;border-radius:8px;overflow:hidden"><img src="${escapeHtml(data.hero_image_url)}" style="width:100%;max-height:400px;object-fit:cover" alt="Hero"></div>`;
  }

  // Summary
  if (data.summary) {
    html += `<div class="info-card" style="margin-bottom:16px"><div class="info-label">${t('art.summary')}</div><div style="font-size:13px;margin-top:6px;line-height:1.6">${escapeHtml(data.summary)}</div></div>`;
  }

  // Content
  html += `
    <div class="info-card" style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div class="info-label">${t('art.content')}</div>
        <button class="btn btn-sm" onclick="copyToClipboard(document.getElementById('article-content').innerText)">${t('art.copyContent')}</button>
      </div>
      <div id="article-content" style="font-size:13px;line-height:1.8;white-space:pre-wrap">${escapeHtml(data.content || '')}</div>
    </div>`;

  // Meta keywords
  if (data.meta_keywords) {
    html += `<div class="info-card"><div class="info-label">${t('art.keywords')}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${data.meta_keywords.split(',').map(k => `<span class="tag">${escapeHtml(k.trim())}</span>`).join('')}</div></div>`;
  }

  app.innerHTML = html;
}

async function deleteArticle(id) {
  if (!confirm(t('confirm.deleteArticle'))) return;
  await api(`/api/articles/${id}`, { method: 'DELETE' });
  showToast(t('toast.articleDeleted'));
  navigate('articles');
}

// ==================== Outreach Bot ====================
async function renderOutreach() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';

  const [campaigns, companiesData, settings] = await Promise.all([
    api('/api/outreach'),
    api('/api/companies'),
    api('/api/settings')
  ]);

  const hasApiKey = settings && settings.llm_api_key;

  let html = `
    <div class="feature-header">
      <div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px">${t('out.title')}</h2>
        <p style="font-size:13px;color:var(--text-muted)">${t('out.subtitle')}</p>
      </div>
    </div>`;

  if (!hasApiKey) {
    html += `
      <div class="info-card" style="text-align:center;padding:32px;margin-bottom:24px;border:1px solid var(--yellow)">
        <div style="font-size:32px;margin-bottom:8px">\uD83D\uDD11</div>
        <div style="font-weight:700;margin-bottom:4px">${t('out.needsApiKey')}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${t('out.needsApiKeyDesc')}</div>
        <button class="btn btn-primary" onclick="navigate('settings')">${t('out.goToSettings')}</button>
      </div>`;
  } else {
    html += `
      <div class="feature-form" style="margin-bottom:24px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div class="form-group">
            <label class="form-label">${t('out.platform')} *</label>
            <select class="form-input" id="out-platform">
              <option value="linkedin">${t('out.linkedin')}</option>
              <option value="twitter">${t('out.twitter')}</option>
              <option value="instagram">${t('out.instagram')}</option>
              <option value="facebook">${t('out.facebook')}</option>
              <option value="xing">${t('out.xing')}</option>
              <option value="email">${t('out.email')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('out.campaignName')}</label>
            <input class="form-input" id="out-campaign" placeholder="${t('out.campaignPlaceholder')}">
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">${t('out.topic')} *</label>
            <textarea class="form-input" id="out-topic" rows="2" placeholder="${t('out.topicPlaceholder')}"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">${t('out.targetAudience')}</label>
            <input class="form-input" id="out-target" placeholder="${t('out.targetPlaceholder')}">
          </div>
          <div class="form-group">
            <label class="form-label">${t('out.tone')}</label>
            <select class="form-input" id="out-tone">
              <option value="professional">${t('art.toneProfessional')}</option>
              <option value="conversational">${t('art.toneConversational')}</option>
              <option value="persuasive">${t('art.tonePersuasive')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('out.language')}</label>
            <select class="form-input" id="out-lang">
              <option value="de" ${getLang() === 'de' ? 'selected' : ''}>${t('art.langDe')}</option>
              <option value="en" ${getLang() === 'en' ? 'selected' : ''}>${t('art.langEn')}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">${t('out.companyContext')}</label>
            <select class="form-input" id="out-company">
              <option value="">— ${t('yt.optional')} —</option>
              ${(companiesData || []).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary" id="out-generate-btn" onclick="generateOutreach()">${t('out.generate')}</button>
        </div>
      </div>`;
  }

  // History
  html += `<h3 style="font-size:15px;font-weight:700;margin-bottom:12px">${t('out.history')}</h3>`;
  if (!campaigns || campaigns.length === 0) {
    html += `
      <div class="empty-state" style="padding:40px">
        <div style="font-size:40px;margin-bottom:8px">\uD83D\uDCE3</div>
        <div class="empty-title">${t('out.noHistory')}</div>
        <div class="empty-desc">${t('out.noHistoryDesc')}</div>
      </div>`;
  } else {
    html += `<div class="companies-list">`;
    for (const c of campaigns) {
      const platformIcons = { linkedin: '\uD83D\uDCBC', twitter: '\uD83D\uDC26', instagram: '\uD83D\uDCF7', facebook: '\uD83D\uDCF1', xing: '\uD83C\uDF10', email: '\u2709\uFE0F' };
      html += `
        <div class="company-row" onclick="navigate('outreach-detail',${c.id})">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:14px">${platformIcons[c.platform] || ''} ${escapeHtml(c.campaign_name || c.topic)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(c.platform)} \u00B7 ${escapeHtml(c.target_audience || '')} \u00B7 ${timeAgo(c.created_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="tag">${c.platform}</span>
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteOutreach(${c.id})">\u2717</button>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  app.innerHTML = html;
}

async function generateOutreach() {
  const topic = document.getElementById('out-topic').value.trim();
  if (!topic) return;
  const btn = document.getElementById('out-generate-btn');
  btn.textContent = t('out.generating');
  btn.disabled = true;

  const result = await api('/api/outreach/generate', {
    method: 'POST',
    body: JSON.stringify({
      platform: document.getElementById('out-platform').value,
      topic,
      target_audience: document.getElementById('out-target').value,
      campaign_name: document.getElementById('out-campaign').value,
      tone: document.getElementById('out-tone').value,
      language: document.getElementById('out-lang').value,
      company_id: document.getElementById('out-company').value || null
    })
  });

  btn.textContent = t('out.generate');
  btn.disabled = false;

  if (result) {
    showToast(t('toast.campaignGenerated'));
    navigate('outreach-detail', result.id);
  }
}

async function renderOutreachDetail(id) {
  currentCampaignId = id;
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';
  const data = await api(`/api/outreach/${id}`);
  if (!data) return;
  const hashtags = JSON.parse(data.hashtags_json || '[]');

  document.getElementById('header-title').textContent = data.campaign_name || data.topic;
  document.getElementById('header-breadcrumb').textContent = '';

  const platformIcons = { linkedin: '\uD83D\uDCBC', twitter: '\uD83D\uDC26', instagram: '\uD83D\uDCF7', facebook: '\uD83D\uDCF1', xing: '\uD83C\uDF10', email: '\u2709\uFE0F' };

  let html = `
    <div class="detail-back" onclick="navigate('outreach')" style="margin-bottom:16px;cursor:pointer;font-size:13px;color:var(--text-muted)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      ${t('out.backToList')}
    </div>

    <div style="margin-bottom:20px">
      <h1 style="font-size:20px;font-weight:800;margin-bottom:6px">${platformIcons[data.platform] || ''} ${escapeHtml(data.campaign_name || data.topic)}</h1>
      <div style="display:flex;gap:12px;font-size:12px;color:var(--text-muted);flex-wrap:wrap">
        <span class="tag">${escapeHtml(data.platform)}</span>
        <span>${escapeHtml(data.target_audience || '')}</span>
        <span>${timeAgo(data.created_at)}</span>
      </div>
    </div>`;

  // Hook
  if (data.hook) {
    html += `
      <div class="info-card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="info-label">${t('out.hook')}</div>
          <button class="btn btn-sm" onclick="copyToClipboard(document.getElementById('outreach-hook').innerText)">${t('out.copyHook')}</button>
        </div>
        <div id="outreach-hook" style="font-size:15px;font-weight:700;margin-top:8px;line-height:1.5">${escapeHtml(data.hook)}</div>
      </div>`;
  }

  // Message
  if (data.message_body) {
    html += `
      <div class="info-card" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="info-label">${t('out.message')}</div>
          <button class="btn btn-sm" onclick="copyToClipboard(document.getElementById('outreach-msg').innerText)">${t('out.copyMessage')}</button>
        </div>
        <div id="outreach-msg" style="font-size:13px;margin-top:8px;line-height:1.7;white-space:pre-wrap">${escapeHtml(data.message_body)}</div>
      </div>`;
  }

  // CTA
  if (data.call_to_action) {
    html += `<div class="info-card" style="margin-bottom:12px"><div class="info-label">${t('out.cta')}</div><div style="font-size:14px;font-weight:600;margin-top:6px;color:var(--accent-400)">${escapeHtml(data.call_to_action)}</div></div>`;
  }

  // Hashtags
  if (hashtags && hashtags.length > 0) {
    html += `<div class="info-card" style="margin-bottom:12px"><div class="info-label">${t('out.hashtags')}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">${hashtags.map(h => `<span class="tag">${escapeHtml(h)}</span>`).join('')}</div></div>`;
  }

  // Image prompt
  if (data.image_prompt) {
    html += `<div class="info-card" style="margin-bottom:12px"><div class="info-label">${t('out.imagePrompt')}</div><div style="font-size:12px;margin-top:6px;color:var(--text-muted);font-style:italic">${escapeHtml(data.image_prompt)}</div></div>`;
  }

  // Copy all button
  const allText = [data.hook, data.message_body, data.call_to_action, hashtags.join(' ')].filter(Boolean).join('\n\n');
  html += `<div style="margin-top:16px"><button class="btn btn-primary" onclick="copyToClipboard(\`${allText.replace(/`/g, '\\`').replace(/\\/g, '\\\\')}\`)">${t('out.copyAll')}</button></div>`;

  app.innerHTML = html;
}

async function deleteOutreach(id) {
  if (!confirm(t('confirm.deleteCampaign'))) return;
  await api(`/api/outreach/${id}`, { method: 'DELETE' });
  showToast(t('toast.campaignDeleted'));
  navigate('outreach');
}

// ==================== Settings ====================
async function renderSettings() {
  const app = document.getElementById('main-body');
  app.innerHTML = '<div class="spinner"></div>';
  const settings = await api('/api/settings') || {};
  const currentProvider = settings.llm_provider || settings._provider || 'kimi';

  const providerPresets = {
    kimi: { url: 'https://api.moonshot.ai/v1', model: 'moonshot-v1-8k', models: ['kimi-k2.5','moonshot-v1-128k','moonshot-v1-32k','moonshot-v1-8k'] },
    openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', models: ['gpt-4o-mini','gpt-4o','gpt-4-turbo','gpt-3.5-turbo'] },
    custom: { url: '', model: '', models: [] }
  };

  const preset = providerPresets[currentProvider] || providerPresets.kimi;
  const currentUrl = settings.llm_base_url || preset.url;
  const currentModel = settings.llm_model || preset.model;

  let html = `
    <div class="feature-header" style="margin-bottom:24px">
      <div>
        <h2 style="font-size:20px;font-weight:800;margin-bottom:4px">${t('set.title')}</h2>
        <p style="font-size:13px;color:var(--text-muted)">${t('set.subtitle')}</p>
      </div>
    </div>

    <!-- Provider Selection -->
    <div class="info-card" style="margin-bottom:20px">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">${t('set.providerSection')}</h3>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${t('set.providerDesc')}</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px">
        <button class="btn provider-btn ${currentProvider === 'kimi' ? 'btn-primary' : ''}" data-provider="kimi" onclick="selectProvider('kimi')" style="padding:12px 8px;font-size:12px;text-align:center;line-height:1.4">
          <div style="font-weight:700;margin-bottom:2px">Kimi</div>
          <div style="font-size:10px;opacity:0.8">Moonshot AI</div>
        </button>
        <button class="btn provider-btn ${currentProvider === 'openai' ? 'btn-primary' : ''}" data-provider="openai" onclick="selectProvider('openai')" style="padding:12px 8px;font-size:12px;text-align:center;line-height:1.4">
          <div style="font-weight:700;margin-bottom:2px">OpenAI</div>
          <div style="font-size:10px;opacity:0.8">GPT + DALL-E</div>
        </button>
        <button class="btn provider-btn ${currentProvider === 'custom' ? 'btn-primary' : ''}" data-provider="custom" onclick="selectProvider('custom')" style="padding:12px 8px;font-size:12px;text-align:center;line-height:1.4">
          <div style="font-weight:700;margin-bottom:2px">Custom</div>
          <div style="font-size:10px;opacity:0.8">${t('set.customCompatible')}</div>
        </button>
      </div>
      <div id="provider-hint" style="font-size:11px;color:var(--text-muted);padding:8px 12px;background:rgba(99,102,241,0.08);border-radius:8px">
        ${t('set.providerHint.' + currentProvider)}
      </div>
    </div>

    <!-- Text AI Config -->
    <div class="info-card" style="margin-bottom:20px">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">${t('set.llmSection')}</h3>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${t('set.llmDesc')}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group" style="grid-column:1/-1">
          <label class="form-label">${t('set.apiKey')}</label>
          <input class="form-input" id="set-api-key" type="password" value="${escapeHtml(settings.llm_api_key || '')}" placeholder="${t('set.apiKeyPlaceholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('set.apiUrl')}</label>
          <input class="form-input" id="set-api-url" value="${escapeHtml(currentUrl)}" placeholder="${t('set.apiUrlPlaceholder')}">
        </div>
        <div class="form-group">
          <label class="form-label">${t('set.apiModel')}</label>
          <select class="form-input" id="set-api-model">
            ${preset.models.map(m => `<option value="${m}" ${m === currentModel ? 'selected' : ''}>${m}</option>`).join('')}
            <option value="_custom" ${!preset.models.includes(currentModel) && currentModel ? 'selected' : ''}>Benutzerdefiniert...</option>
          </select>
          <input class="form-input" id="set-api-model-custom" value="${escapeHtml(!preset.models.includes(currentModel) ? currentModel : '')}" placeholder="Modellname eingeben..." style="margin-top:6px;display:${!preset.models.includes(currentModel) && currentModel ? 'block' : 'none'}">
        </div>
      </div>

      <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
        <span style="font-size:12px;color:var(--text-muted)">${t('set.status')}:</span>
        <span style="font-size:12px;font-weight:700;color:${settings._isConfigured ? 'var(--green)' : 'var(--red)'}">${settings._isConfigured ? '\u2713 ' + t('set.configured') : '\u2717 ' + t('set.notConfigured')}</span>
      </div>
    </div>

    <!-- Image Generation Config -->
    <div class="info-card" style="margin-bottom:20px">
      <h3 style="font-size:15px;font-weight:700;margin-bottom:4px">${t('set.imageSection')}</h3>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${t('set.imageDesc')}</p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="form-group">
          <label class="form-label">${t('set.imageApiKey')}</label>
          <input class="form-input" id="set-img-key" type="password" value="${escapeHtml(settings.image_api_key || '')}" placeholder="${t('set.imageApiKeyPlaceholder')}">
          <span style="font-size:10px;color:var(--text-muted);margin-top:2px;display:block">${t('set.imageKeyHint')}</span>
        </div>
        <div class="form-group">
          <label class="form-label">${t('set.imageApiUrl')}</label>
          <input class="form-input" id="set-img-url" value="${escapeHtml(settings.image_base_url || 'https://api.openai.com/v1')}" placeholder="${t('set.imageApiUrlPlaceholder')}">
          <span style="font-size:10px;color:var(--text-muted);margin-top:2px;display:block">DALL-E ben\u00f6tigt OpenAI URL</span>
        </div>
      </div>

      <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
        <span style="font-size:12px;color:var(--text-muted)">${t('set.status')}:</span>
        <span style="font-size:12px;font-weight:700;color:${settings._isImageConfigured ? 'var(--green)' : 'var(--text-muted)'}">${settings._isImageConfigured ? '\u2713 ' + t('set.configured') : '\u2014 Optional'}</span>
      </div>
    </div>

    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" id="set-save-btn" onclick="saveSettings()">${t('set.save')}</button>
      <button class="btn" id="set-test-btn" onclick="testLLM()">${t('set.testConnection')}</button>
    </div>`;

  app.innerHTML = html;

  // Model dropdown toggle for custom input
  const modelSelect = document.getElementById('set-api-model');
  const modelCustom = document.getElementById('set-api-model-custom');
  if (modelSelect) {
    modelSelect.addEventListener('change', () => {
      modelCustom.style.display = modelSelect.value === '_custom' ? 'block' : 'none';
    });
  }
}

function selectProvider(provider) {
  const presets = {
    kimi: { url: 'https://api.moonshot.ai/v1', model: 'moonshot-v1-8k', models: ['kimi-k2.5','moonshot-v1-128k','moonshot-v1-32k','moonshot-v1-8k'] },
    openai: { url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', models: ['gpt-4o-mini','gpt-4o','gpt-4-turbo','gpt-3.5-turbo'] },
    custom: { url: '', model: '', models: [] }
  };
  const preset = presets[provider];

  // Update button styles
  document.querySelectorAll('.provider-btn').forEach(btn => {
    btn.classList.toggle('btn-primary', btn.dataset.provider === provider);
  });

  // Update hint
  document.getElementById('provider-hint').textContent = t('set.providerHint.' + provider);

  // Auto-fill URL and model
  document.getElementById('set-api-url').value = preset.url;
  const modelSelect = document.getElementById('set-api-model');
  modelSelect.innerHTML = preset.models.map(m => `<option value="${m}">${m}</option>`).join('') + '<option value="_custom">Benutzerdefiniert...</option>';
  if (preset.model) modelSelect.value = preset.model;

  // Hide custom model input
  document.getElementById('set-api-model-custom').style.display = 'none';

  // Store provider choice
  window._selectedProvider = provider;
}

async function saveSettings() {
  const btn = document.getElementById('set-save-btn');
  btn.textContent = t('set.saving');
  btn.disabled = true;

  const modelSelect = document.getElementById('set-api-model');
  const modelValue = modelSelect.value === '_custom'
    ? document.getElementById('set-api-model-custom').value
    : modelSelect.value;

  await api('/api/settings', {
    method: 'PUT',
    body: JSON.stringify({
      llm_provider: window._selectedProvider || document.querySelector('.provider-btn.btn-primary')?.dataset?.provider || 'kimi',
      llm_api_key: document.getElementById('set-api-key').value,
      llm_base_url: document.getElementById('set-api-url').value,
      llm_model: modelValue,
      image_api_key: document.getElementById('set-img-key').value,
      image_base_url: document.getElementById('set-img-url').value
    })
  });

  btn.textContent = t('set.save');
  btn.disabled = false;
  showToast(t('toast.settingsSaved'));
}

async function testLLM() {
  const btn = document.getElementById('set-test-btn');
  btn.textContent = t('set.testing');
  btn.disabled = true;

  // Save first, then test
  await saveSettings();
  const result = await api('/api/settings/test-llm', { method: 'POST' });

  btn.textContent = t('set.testConnection');
  btn.disabled = false;

  if (result && result.success) {
    showToast(`\u2713 ${result.providerName || 'LLM'}: ${result.response || 'OK'}`);
  } else {
    showToast(t('toast.llmTestFailed') + (result?.error ? ': ' + result.error : ''), 'error');
  }
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
