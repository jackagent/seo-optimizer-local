// ==================== State ====================
let currentPage = 'home';
let companies = [];
let stats = {};
let discrepancies = [];

// ==================== Navigation ====================
function navigate(page, data) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navBtn = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');

  switch (page) {
    case 'home': renderHome(); break;
    case 'dashboard': renderDashboard(); break;
    case 'companies': renderCompanies(); break;
    case 'company-detail': renderCompanyDetail(data); break;
    default: renderHome();
  }
}

// ==================== API Helpers ====================
async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts
  });
  return res.json();
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function scoreColor(score) {
  if (score >= 80) return 'var(--emerald)';
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
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--border)" stroke-width="4"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="4"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
      </svg>
      <div class="value" style="color:${color}">${score || '—'}</div>
    </div>`;
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ==================== Home Page ====================
async function renderHome() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="spinner"></div>';

  const [statsData, discData, companiesData] = await Promise.all([
    api('/api/dashboard/stats'),
    api('/api/dashboard/discrepancies'),
    api('/api/dashboard/companies')
  ]);
  stats = statsData;
  discrepancies = discData;
  companies = companiesData;

  let html = `
    <div class="page-header">
      <div>
        <h1 class="page-title">SEO & Compliance Optimizer</h1>
        <p class="page-subtitle">Portfolio Overview</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="showAddCompanyModal()">+ Add Company</button>
        <button class="btn" onclick="scanAll()">&#x1F504; Scan All</button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Companies</div>
        <div class="stat-value">${stats.totalCompanies}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Avg SEO Score</div>
        <div class="stat-value">${stats.avgScore}<span class="suffix">/100</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Critical Issues</div>
        <div class="stat-value ${stats.criticalIssues > 0 ? 'alert' : ''}">${stats.criticalIssues}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Scans Today</div>
        <div class="stat-value">${stats.scansToday}</div>
      </div>
    </div>`;

  // Discrepancy banner
  if (discrepancies.length > 0) {
    let totalDisc = discrepancies.reduce((sum, d) => sum + d.discrepancies.length, 0);
    html += `
      <div class="discrepancy-banner">
        <div class="discrepancy-header">
          <span style="font-size:20px">&#x26A0;&#xFE0F;</span>
          <h3>DATA DISCREPANCIES DETECTED — ${totalDisc} mismatch${totalDisc > 1 ? 'es' : ''} across ${discrepancies.length} compan${discrepancies.length > 1 ? 'ies' : 'y'}</h3>
        </div>`;

    for (const item of discrepancies) {
      html += `
        <div style="margin-bottom:12px">
          <div style="font-size:13px;font-weight:600;margin-bottom:6px;cursor:pointer" onclick="navigate('company-detail',${item.companyId})">
            ${item.companyName} <span style="color:var(--fg-muted);font-weight:400">(${item.companyUrl})</span>
          </div>
          <table class="discrepancy-table">
            <tr><th>Field</th><th>Database</th><th>Website</th><th>Severity</th></tr>
            ${item.discrepancies.map(d => `
              <tr>
                <td>${d.field}</td>
                <td>${d.dbValue}</td>
                <td>${d.websiteValue}</td>
                <td class="severity-${d.severity}">${d.severity.toUpperCase()}</td>
              </tr>
            `).join('')}
          </table>
        </div>`;
    }
    html += `</div>`;
  }

  // Company cards or empty state
  if (companies.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon">&#x1F3E2;</div>
        <div class="empty-title">No companies yet</div>
        <div class="empty-desc">Add your first company to start scanning and monitoring SEO & compliance.</div>
        <button class="btn btn-primary" onclick="showAddCompanyModal()">+ Add Your First Company</button>
      </div>`;
  } else {
    html += `<div class="cards-grid">`;
    for (const c of companies) {
      const scan = c.latestScan;
      const score = scan?.overall_score || 0;
      html += `
        <div class="company-card" onclick="navigate('company-detail',${c.id})">
          <div class="card-header">
            <div>
              <div class="card-name">${c.name}</div>
              <div class="card-url">${c.url}</div>
              <div class="card-tags">
                ${c.sector ? `<span class="tag tag-sector">${c.sector}</span>` : ''}
                ${c.hosting_platform ? `<span class="tag tag-platform">${c.hosting_platform}</span>` : ''}
                ${c.is_parked_domain ? '<span class="tag tag-parked">PARKED</span>' : ''}
              </div>
            </div>
            ${scan ? scoreGaugeSVG(score) : '<div style="font-size:11px;color:var(--fg-subtle)">No scan</div>'}
          </div>
          ${scan ? `
            <div class="score-bars">
              ${['Meta', 'Content', 'Technical', 'Legal'].map((label, i) => {
                const val = [scan.meta_score, scan.content_score, scan.technical_score, scan.legal_score][i] || 0;
                return `<div><div class="score-bar-label"><span>${label}</span><span>${val}</span></div><div class="score-bar-track"><div class="score-bar-fill ${fillClass(val)}" style="width:${val}%"></div></div></div>`;
              }).join('')}
            </div>
            <div class="badges">
              <span class="badge ${scan.has_impressum ? 'badge-ok' : 'badge-fail'}">${scan.has_impressum ? '&#x2713;' : '&#x2717;'} Impressum</span>
              <span class="badge ${scan.has_privacy_policy ? 'badge-ok' : 'badge-fail'}">${scan.has_privacy_policy ? '&#x2713;' : '&#x2717;'} Privacy</span>
              <span class="badge ${scan.has_terms_of_service ? 'badge-ok' : 'badge-fail'}">${scan.has_terms_of_service ? '&#x2713;' : '&#x2717;'} Terms</span>
            </div>
            <div class="card-footer">Scanned ${timeAgo(scan.scanned_at)} · ${scan.pages_crawled || 0} pages</div>
          ` : '<div class="card-footer">Not yet scanned</div>'}
        </div>`;
    }
    html += `</div>`;
  }

  app.innerHTML = html;
}

// ==================== Dashboard Page ====================
async function renderDashboard() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="spinner"></div>';

  const companiesData = await api('/api/dashboard/companies');
  companies = companiesData;

  let html = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Portfolio Dashboard</h1>
        <p class="page-subtitle">${companies.length} companies tracked</p>
      </div>
    </div>
    <div class="cards-grid">`;

  for (const c of companies) {
    const scan = c.latestScan;
    const score = scan?.overall_score || 0;
    html += `
      <div class="company-card" onclick="navigate('company-detail',${c.id})">
        <div class="card-header">
          <div>
            <div class="card-name">${c.name}</div>
            <div class="card-url">${c.url}</div>
          </div>
          ${scan ? scoreGaugeSVG(score) : ''}
        </div>
        ${scan ? `
          <div class="score-bars">
            ${['Meta', 'Content', 'Technical', 'Legal'].map((label, i) => {
              const val = [scan.meta_score, scan.content_score, scan.technical_score, scan.legal_score][i] || 0;
              return `<div><div class="score-bar-label"><span>${label}</span><span>${val}</span></div><div class="score-bar-track"><div class="score-bar-fill ${fillClass(val)}" style="width:${val}%"></div></div></div>`;
            }).join('')}
          </div>
          <div class="badges">
            <span class="badge ${scan.has_impressum ? 'badge-ok' : 'badge-fail'}">${scan.has_impressum ? '&#x2713;' : '&#x2717;'} Impressum</span>
            <span class="badge ${scan.has_privacy_policy ? 'badge-ok' : 'badge-fail'}">${scan.has_privacy_policy ? '&#x2713;' : '&#x2717;'} Privacy</span>
            <span class="badge ${scan.has_terms_of_service ? 'badge-ok' : 'badge-fail'}">${scan.has_terms_of_service ? '&#x2713;' : '&#x2717;'} Terms</span>
          </div>
        ` : '<div style="padding:20px 0;text-align:center;color:var(--fg-muted);font-size:12px">Not yet scanned</div>'}
      </div>`;
  }

  html += `</div>`;
  app.innerHTML = html;
}

// ==================== Companies List ====================
async function renderCompanies() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="spinner"></div>';

  const data = await api('/api/companies');

  let html = `
    <div class="page-header">
      <div>
        <h1 class="page-title">Companies</h1>
        <p class="page-subtitle">${data.length} companies in portfolio</p>
      </div>
      <button class="btn btn-primary" onclick="showAddCompanyModal()">+ Add Company</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">`;

  for (const c of data) {
    html += `
      <div class="doc-item" style="cursor:pointer" onclick="navigate('company-detail',${c.id})">
        <div>
          <div class="doc-name">${c.name}</div>
          <div class="doc-meta">${c.url} ${c.sector ? '· ' + c.sector : ''}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="event.stopPropagation();triggerScan(${c.id})">Scan</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();deleteCompany(${c.id},'${c.name}')">Delete</button>
        </div>
      </div>`;
  }

  if (data.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-icon">&#x1F3E2;</div>
        <div class="empty-title">No companies yet</div>
        <div class="empty-desc">Add your first company to get started.</div>
        <button class="btn btn-primary" onclick="showAddCompanyModal()">+ Add Company</button>
      </div>`;
  }

  html += `</div>`;
  app.innerHTML = html;
}

// ==================== Company Detail ====================
async function renderCompanyDetail(companyId) {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="spinner"></div>';

  const data = await api(`/api/companies/${companyId}`);
  const scan = data.latestScan;

  let html = `
    <div class="detail-header">
      <div class="detail-back" onclick="navigate('home')">&#x2190; Back to Portfolio</div>
      <div class="detail-title-row">
        <div>
          <h1 class="page-title">${data.name}</h1>
          <p class="page-subtitle"><a href="${ensureProtocol(data.url)}" target="_blank">${data.url}</a></p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="triggerScan(${data.id})">&#x1F504; Re-scan</button>
          <button class="btn" onclick="showFixPrompt(${data.id})">&#x1F4CB; Fix Prompt</button>
          <button class="btn" onclick="showEditCompanyModal(${JSON.stringify(data).replace(/"/g, '&quot;')})">Edit</button>
        </div>
      </div>
    </div>`;

  // Discrepancy alert
  if (scan) {
    const disc = JSON.parse(scan.discrepancies_json || '[]');
    if (disc.length > 0) {
      html += `
        <div class="discrepancy-banner">
          <div class="discrepancy-header">
            <span style="font-size:20px">&#x26A0;&#xFE0F;</span>
            <h3>DATA DISCREPANCY DETECTED — ${disc.length} mismatch${disc.length > 1 ? 'es' : ''}</h3>
          </div>
          <table class="discrepancy-table">
            <tr><th>Field</th><th>Database</th><th>Website</th><th>Severity</th></tr>
            ${disc.map(d => `
              <tr>
                <td>${d.field}</td>
                <td>${d.dbValue}</td>
                <td>${d.websiteValue}</td>
                <td class="severity-${d.severity}">${d.severity.toUpperCase()}</td>
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
        ${[['Overall', scan.overall_score], ['Meta', scan.meta_score], ['Content', scan.content_score], ['Technical', scan.technical_score], ['Legal', scan.legal_score]].map(([label, val]) => `
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
      <button class="tab active" onclick="switchTab(this,'tab-issues')">Issues</button>
      <button class="tab" onclick="switchTab(this,'tab-legal')">Legal</button>
      <button class="tab" onclick="switchTab(this,'tab-info')">Company Info</button>
      <button class="tab" onclick="switchTab(this,'tab-docs')">Documents</button>
      <button class="tab" onclick="switchTab(this,'tab-history')">Scan History</button>
    </div>`;

  // Issues tab
  html += `<div class="tab-content active" id="tab-issues">`;
  if (scan) {
    const issues = JSON.parse(scan.issues_json || '[]');
    if (issues.length === 0) {
      html += '<div style="text-align:center;padding:40px;color:var(--fg-muted)">No issues found</div>';
    }
    for (const issue of issues) {
      html += `
        <div class="issue-item">
          <span class="issue-severity ${issue.severity}">${issue.severity}</span>
          <div class="issue-title">${issue.title}</div>
          <div class="issue-desc">${issue.description}</div>
          <div class="issue-fix">Fix: ${issue.fix}</div>
        </div>`;
    }
  } else {
    html += '<div style="text-align:center;padding:40px;color:var(--fg-muted)">Run a scan to see issues</div>';
  }
  html += `</div>`;

  // Legal tab
  html += `<div class="tab-content" id="tab-legal">`;
  if (scan) {
    const legal = JSON.parse(scan.legal_json || '{}');
    const cookie = JSON.parse(scan.cookie_json || '{}');
    html += `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px">
        ${[['Impressum', scan.has_impressum, legal.impressum?.url], ['Privacy Policy', scan.has_privacy_policy, legal.privacy?.url], ['Terms of Service', scan.has_terms_of_service, legal.terms?.url], ['Cookie Banner', cookie.detected ? 1 : 0, null]].map(([label, found, url]) => `
          <div class="stat-card">
            <div class="stat-label">${label}</div>
            <div style="font-size:14px;font-weight:600;color:${found ? 'var(--primary)' : 'var(--red)'}">${found ? 'Found' : 'Missing'}</div>
            ${url ? `<a href="${url}" target="_blank" style="font-size:11px">View</a>` : ''}
          </div>
        `).join('')}
      </div>
      ${cookie.detected ? `
        <div class="stat-card">
          <div class="stat-label">Cookie Compliance Score</div>
          <div class="stat-value">${cookie.score || 0}<span class="suffix">/100</span></div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
            <span class="badge ${cookie.hasRejectAll ? 'badge-ok' : 'badge-fail'}">Reject All</span>
            <span class="badge ${cookie.hasGranularChoices ? 'badge-ok' : 'badge-fail'}">Granular Choices</span>
            <span class="badge ${cookie.hasNecessaryOnly ? 'badge-ok' : 'badge-fail'}">Necessary Only</span>
            <span class="badge ${cookie.hasCookiePolicy ? 'badge-ok' : 'badge-fail'}">Cookie Policy</span>
          </div>
        </div>
      ` : ''}`;
  } else {
    html += '<div style="text-align:center;padding:40px;color:var(--fg-muted)">Run a scan to see legal compliance</div>';
  }
  html += `</div>`;

  // Company Info tab
  html += `<div class="tab-content" id="tab-info">`;
  if (data.details) {
    const d = data.details;
    html += `
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        ${[['Company Number', d.company_number], ['Company Type', d.company_type], ['Jurisdiction', d.jurisdiction], ['Registered Address', d.registered_address], ['Incorporation Date', d.incorporation_date], ['VAT Number', d.vat_number], ['Email', d.registered_email], ['Phone', d.registered_phone], ['Lead Director', d.lead_director], ['Director Title', d.lead_director_title], ['Local Director', d.local_director], ['Share Capital', d.share_capital], ['Share Type', d.share_type], ['Share Count', d.share_count]].map(([label, val]) => `
          <div class="stat-card">
            <div class="stat-label">${label}</div>
            <div style="font-size:13px;font-weight:500">${val || '<span style="color:var(--fg-subtle)">Not specified</span>'}</div>
          </div>
        `).join('')}
      </div>`;
  } else {
    html += `
      <div style="text-align:center;padding:40px;color:var(--fg-muted)">
        <p>No company details stored yet.</p>
        <p style="margin-top:8px;font-size:12px">Run a scan to auto-extract details from the Impressum, or add them manually.</p>
        <button class="btn btn-primary" style="margin-top:12px" onclick="showEditDetailsModal(${data.id})">Add Details</button>
      </div>`;
  }
  html += `</div>`;

  // Documents tab
  html += `<div class="tab-content" id="tab-docs">`;
  html += `<div style="margin-bottom:12px"><button class="btn btn-primary btn-sm" onclick="showUploadModal(${data.id})">Upload Document</button></div>`;
  if (data.documents && data.documents.length > 0) {
    for (const doc of data.documents) {
      html += `
        <div class="doc-item">
          <div>
            <div class="doc-name">${doc.file_name}</div>
            <div class="doc-meta">${doc.category} · ${formatBytes(doc.file_size)}</div>
          </div>
          <div style="display:flex;gap:6px">
            <a class="btn btn-sm" href="/uploads/${data.id}/${doc.file_name}" target="_blank">View</a>
            <button class="btn btn-sm btn-danger" onclick="deleteDoc(${doc.id})">Delete</button>
          </div>
        </div>`;
    }
  } else {
    html += '<div style="text-align:center;padding:20px;color:var(--fg-muted);font-size:12px">No documents uploaded</div>';
  }
  html += `</div>`;

  // Scan History tab
  html += `<div class="tab-content" id="tab-history">`;
  if (data.scanHistory && data.scanHistory.length > 0) {
    for (const s of data.scanHistory) {
      html += `
        <div class="doc-item">
          <div>
            <div class="doc-name">Score: ${s.overall_score || '—'}/100 <span style="font-size:11px;color:var(--fg-muted)">(${s.status})</span></div>
            <div class="doc-meta">${new Date(s.scanned_at).toLocaleString()} · ${s.pages_crawled || 0} pages</div>
          </div>
        </div>`;
    }
  } else {
    html += '<div style="text-align:center;padding:20px;color:var(--fg-muted);font-size:12px">No scan history</div>';
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
  showToast('Scan started...');
  await api(`/api/companies/${companyId}/scan`, { method: 'POST' });
  // Poll for completion
  const poll = setInterval(async () => {
    const scan = await api(`/api/companies/${companyId}/scan/latest`);
    if (scan.status === 'completed' || scan.status === 'failed') {
      clearInterval(poll);
      showToast(scan.status === 'completed' ? `Scan complete! Score: ${scan.overall_score}/100` : 'Scan failed', scan.status === 'completed' ? 'success' : 'error');
      if (currentPage === 'company-detail') renderCompanyDetail(companyId);
      else navigate(currentPage);
    }
  }, 5000);
}

async function scanAll() {
  showToast('Scanning all companies...');
  const result = await api('/api/scan-all', { method: 'POST' });
  showToast(`${result.scans?.length || 0} scans queued`);
}

async function deleteCompany(id, name) {
  if (!confirm(`Delete "${name}"? This will remove all scans and documents.`)) return;
  await api(`/api/companies/${id}`, { method: 'DELETE' });
  showToast(`${name} deleted`);
  navigate(currentPage);
}

async function deleteDoc(id) {
  if (!confirm('Delete this document?')) return;
  await api(`/api/documents/${id}`, { method: 'DELETE' });
  showToast('Document deleted');
  // Refresh current page
  const backBtn = document.querySelector('.detail-back');
  if (backBtn) {
    const match = window.location.hash.match(/company-(\d+)/);
    if (match) renderCompanyDetail(parseInt(match[1]));
  }
}

async function showFixPrompt(companyId) {
  const data = await api(`/api/companies/${companyId}/fix-prompt`);
  showModal(`
    <h2>Fix All Issues Prompt</h2>
    <div style="margin-bottom:12px;display:flex;gap:8px">
      <span class="badge badge-fail">${data.critical} Critical</span>
      <span class="badge" style="background:var(--yellow-10);color:var(--yellow)">${data.warnings} Warnings</span>
      <span style="font-size:11px;color:var(--fg-muted);align-self:center">${data.issueCount} total issues</span>
    </div>
    <div class="prompt-box" id="prompt-text">${escapeHtml(data.prompt)}</div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="copyPrompt()">Copy Prompt</button>
    </div>
  `);
}

function copyPrompt() {
  const text = document.getElementById('prompt-text').textContent;
  navigator.clipboard.writeText(text).then(() => showToast('Prompt copied!'));
}

// ==================== Add Company Modal ====================
function showAddCompanyModal() {
  showModal(`
    <h2>Add Company</h2>
    <form onsubmit="addCompany(event)">
      <div class="form-group">
        <label class="form-label">Company Name *</label>
        <input class="form-input" id="add-name" required placeholder="e.g. Acme Corp">
      </div>
      <div class="form-group">
        <label class="form-label">Website URL *</label>
        <input class="form-input" id="add-url" required placeholder="e.g. acme.com">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sector</label>
          <input class="form-input" id="add-sector" placeholder="e.g. FinTech, Health">
        </div>
        <div class="form-group">
          <label class="form-label">Hosting Platform</label>
          <input class="form-input" id="add-platform" placeholder="e.g. WordPress, Shopify">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="add-desc" rows="3" placeholder="Brief description..."></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Add & Scan</button>
      </div>
    </form>
  `);
}

async function addCompany(e) {
  e.preventDefault();
  const name = document.getElementById('add-name').value;
  const url = document.getElementById('add-url').value;
  const sector = document.getElementById('add-sector').value;
  const hosting_platform = document.getElementById('add-platform').value;
  const description = document.getElementById('add-desc').value;

  const result = await api('/api/companies', {
    method: 'POST',
    body: JSON.stringify({ name, url, description, sector, hosting_platform })
  });

  closeModal();
  showToast(`${name} added! Starting scan...`);
  navigate('home');

  // Auto-trigger scan
  triggerScan(result.id);
}

function showEditCompanyModal(data) {
  showModal(`
    <h2>Edit Company</h2>
    <form onsubmit="editCompany(event, ${data.id})">
      <div class="form-group">
        <label class="form-label">Company Name</label>
        <input class="form-input" id="edit-name" value="${data.name}">
      </div>
      <div class="form-group">
        <label class="form-label">Website URL</label>
        <input class="form-input" id="edit-url" value="${data.url}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Sector</label>
          <input class="form-input" id="edit-sector" value="${data.sector || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Hosting Platform</label>
          <input class="form-input" id="edit-platform" value="${data.hosting_platform || ''}">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="edit-desc" rows="3">${data.description || ''}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
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
  showToast('Company updated');
  renderCompanyDetail(id);
}

// Upload modal
function showUploadModal(companyId) {
  showModal(`
    <h2>Upload Document</h2>
    <form id="upload-form" enctype="multipart/form-data">
      <div class="form-group">
        <label class="form-label">File</label>
        <input type="file" class="form-input" id="upload-file" required>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-input" id="upload-category">
            <option value="incorporation">Incorporation</option>
            <option value="governance">Governance</option>
            <option value="tax">Tax</option>
            <option value="legal">Legal</option>
            <option value="financial">Financial</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <input class="form-input" id="upload-desc" placeholder="Optional description">
        </div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="uploadDoc(${companyId})">Upload</button>
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
  showToast('Document uploaded');
  renderCompanyDetail(companyId);
}

// Edit details modal
function showEditDetailsModal(companyId) {
  showModal(`
    <h2>Company Details</h2>
    <form onsubmit="saveDetails(event, ${companyId})">
      <div class="form-row">
        <div class="form-group"><label class="form-label">Company Number</label><input class="form-input" id="det-number"></div>
        <div class="form-group"><label class="form-label">Company Type</label><input class="form-input" id="det-type" placeholder="e.g. GmbH, Ltd"></div>
      </div>
      <div class="form-group"><label class="form-label">Registered Address</label><input class="form-input" id="det-address"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Jurisdiction</label><input class="form-input" id="det-jurisdiction"></div>
        <div class="form-group"><label class="form-label">Incorporation Date</label><input class="form-input" id="det-incdate" placeholder="DD.MM.YYYY"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">VAT Number</label><input class="form-input" id="det-vat"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="det-email"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Lead Director</label><input class="form-input" id="det-director"></div>
        <div class="form-group"><label class="form-label">Director Title</label><input class="form-input" id="det-dirtitle" placeholder="e.g. Geschäftsführer"></div>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
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
  showToast('Details saved');
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

// ==================== Utilities ====================
function ensureProtocol(url) {
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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== Init ====================
document.addEventListener('DOMContentLoaded', () => {
  navigate('home');
});
