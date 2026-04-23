const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'seo-optimizer.db');

// Auto-setup if DB doesn't exist
if (!fs.existsSync(DB_PATH)) {
  require('./setup-db');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Auto-migrate: add new tables if they don't exist yet (for existing DBs)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS youtube_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      youtube_url TEXT NOT NULL,
      channel_name TEXT,
      video_title TEXT,
      video_description TEXT,
      tags_json TEXT DEFAULT '[]',
      thumbnail_url TEXT,
      view_count INTEGER,
      like_count INTEGER,
      comment_count INTEGER,
      subscriber_count INTEGER,
      duration TEXT,
      published_at TEXT,
      seo_score INTEGER,
      issues_json TEXT DEFAULT '[]',
      recommendations_json TEXT DEFAULT '[]',
      analysis_data_json TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      title TEXT NOT NULL,
      content TEXT,
      summary TEXT,
      keywords_json TEXT DEFAULT '[]',
      platform TEXT DEFAULT 'blog',
      tone TEXT DEFAULT 'professional',
      language TEXT DEFAULT 'de',
      word_count INTEGER DEFAULT 0,
      seo_score INTEGER,
      hero_image_url TEXT,
      hero_image_prompt TEXT,
      inline_images_json TEXT DEFAULT '[]',
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS outreach_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      platform TEXT NOT NULL DEFAULT 'linkedin',
      campaign_name TEXT,
      target_audience TEXT,
      tone TEXT DEFAULT 'professional',
      language TEXT DEFAULT 'de',
      hook TEXT,
      message_body TEXT,
      call_to_action TEXT,
      hashtags_json TEXT DEFAULT '[]',
      image_prompt TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);
} catch (e) {
  // Tables already exist, ignore
}

module.exports = {
  // ==================== Companies ====================
  getAllCompanies() {
    return db.prepare('SELECT * FROM companies WHERE is_active = 1 ORDER BY name').all();
  },

  getCompanyById(id) {
    return db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
  },

  createCompany({ name, url, description, sector, hosting_platform }) {
    const stmt = db.prepare('INSERT INTO companies (name, url, description, sector, hosting_platform) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name, url, description || null, sector || null, hosting_platform || null);
    return { id: result.lastInsertRowid, name, url };
  },

  updateCompany(id, data) {
    const allowed = ['name', 'url', 'description', 'sector', 'hosting_platform', 'is_active', 'is_parked_domain'];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    if (Object.keys(updates).length === 0) return;
    const fields = Object.keys(updates).map(k => `${k}=@${k}`).join(', ');
    db.prepare(`UPDATE companies SET ${fields}, updated_at=datetime('now') WHERE id=@id`)
      .run({ ...updates, id });
  },

  deleteCompany(id) {
    db.prepare('DELETE FROM companies WHERE id = ?').run(id);
  },

  // ==================== Company Details ====================
  getCompanyDetails(companyId) {
    return db.prepare('SELECT * FROM company_details WHERE company_id = ?').get(companyId);
  },

  upsertCompanyDetails(companyId, details) {
    const existing = db.prepare('SELECT id FROM company_details WHERE company_id = ?').get(companyId);
    if (existing) {
      const fields = Object.keys(details).filter(k => k !== 'company_id').map(k => `${k}=@${k}`).join(', ');
      if (fields) {
        db.prepare(`UPDATE company_details SET ${fields}, updated_at=datetime('now') WHERE company_id = @company_id`)
          .run({ ...details, company_id: companyId });
      }
    } else {
      const keys = ['company_id', ...Object.keys(details)];
      const placeholders = keys.map(k => `@${k}`).join(', ');
      db.prepare(`INSERT INTO company_details (${keys.join(', ')}) VALUES (${placeholders})`)
        .run({ company_id: companyId, ...details });
    }
  },

  // ==================== Scans ====================
  getLatestScan(companyId) {
    return db.prepare('SELECT * FROM scans WHERE company_id = ? ORDER BY scanned_at DESC LIMIT 1').get(companyId);
  },

  getAllLatestScans() {
    return db.prepare(`
      SELECT s.*, c.name as company_name, c.url as company_url, c.sector, c.hosting_platform, c.is_parked_domain
      FROM scans s
      INNER JOIN (SELECT company_id, MAX(scanned_at) as max_date FROM scans GROUP BY company_id) latest
        ON s.company_id = latest.company_id AND s.scanned_at = latest.max_date
      INNER JOIN companies c ON s.company_id = c.id
      ORDER BY c.name
    `).all();
  },

  createScan(companyId) {
    const result = db.prepare("INSERT INTO scans (company_id, status) VALUES (?, 'running')").run(companyId);
    return result.lastInsertRowid;
  },

  updateScan(scanId, data) {
    const fields = Object.keys(data).map(k => `${k}=@${k}`).join(', ');
    db.prepare(`UPDATE scans SET ${fields} WHERE id = @id`).run({ ...data, id: scanId });
  },

  getScanHistory(companyId) {
    return db.prepare('SELECT * FROM scans WHERE company_id = ? ORDER BY scanned_at DESC LIMIT 20').all(companyId);
  },

  // ==================== Documents ====================
  getDocuments(companyId) {
    return db.prepare('SELECT * FROM company_documents WHERE company_id = ? ORDER BY uploaded_at DESC').all(companyId);
  },

  addDocument(companyId, { file_name, file_path, file_size, mime_type, category, description }) {
    const result = db.prepare('INSERT INTO company_documents (company_id, file_name, file_path, file_size, mime_type, category, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(companyId, file_name, file_path, file_size || 0, mime_type || 'application/pdf', category || 'other', description || null);
    return result.lastInsertRowid;
  },

  deleteDocument(id) {
    const doc = db.prepare('SELECT file_path FROM company_documents WHERE id = ?').get(id);
    if (doc && fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }
    db.prepare('DELETE FROM company_documents WHERE id = ?').run(id);
  },

  // ==================== Dashboard Stats ====================
  getDashboardStats() {
    const companies = db.prepare('SELECT COUNT(*) as count FROM companies WHERE is_active = 1').get();
    const avgScore = db.prepare(`
      SELECT AVG(s.overall_score) as avg FROM scans s
      INNER JOIN (SELECT company_id, MAX(scanned_at) as max_date FROM scans GROUP BY company_id) latest
        ON s.company_id = latest.company_id AND s.scanned_at = latest.max_date
      WHERE s.overall_score IS NOT NULL
    `).get();
    const today = new Date().toISOString().split('T')[0];
    const scansToday = db.prepare("SELECT COUNT(*) as count FROM scans WHERE scanned_at >= ?").get(today);

    let criticalIssues = 0;
    const latestScans = db.prepare(`
      SELECT issues_json FROM scans s
      INNER JOIN (SELECT company_id, MAX(scanned_at) as max_date FROM scans GROUP BY company_id) latest
        ON s.company_id = latest.company_id AND s.scanned_at = latest.max_date
    `).all();
    for (const scan of latestScans) {
      try {
        const issues = JSON.parse(scan.issues_json || '[]');
        criticalIssues += issues.filter(i => i.severity === 'critical').length;
      } catch {}
    }

    const articles = db.prepare('SELECT COUNT(*) as count FROM articles').get();
    const campaigns = db.prepare('SELECT COUNT(*) as count FROM outreach_campaigns').get();
    const ytAnalyses = db.prepare('SELECT COUNT(*) as count FROM youtube_analyses').get();

    return {
      totalCompanies: companies.count,
      avgScore: Math.round(avgScore.avg || 0),
      criticalIssues,
      scansToday: scansToday.count,
      totalArticles: articles.count,
      totalCampaigns: campaigns.count,
      totalYoutubeAnalyses: ytAnalyses.count
    };
  },

  // ==================== Discrepancies ====================
  getAllDiscrepancies() {
    const scans = db.prepare(`
      SELECT s.company_id, s.discrepancies_json, s.scanned_at, c.name as company_name, c.url as company_url
      FROM scans s
      INNER JOIN (SELECT company_id, MAX(scanned_at) as max_date FROM scans GROUP BY company_id) latest
        ON s.company_id = latest.company_id AND s.scanned_at = latest.max_date
      INNER JOIN companies c ON s.company_id = c.id
      WHERE s.discrepancies_json IS NOT NULL AND s.discrepancies_json != '[]'
    `).all();

    return scans.map(s => ({
      companyId: s.company_id,
      companyName: s.company_name,
      companyUrl: s.company_url,
      scannedAt: s.scanned_at,
      discrepancies: JSON.parse(s.discrepancies_json || '[]')
    })).filter(s => s.discrepancies.length > 0);
  },

  // ==================== YouTube Analyses ====================
  createYoutubeAnalysis(data) {
    const result = db.prepare(`
      INSERT INTO youtube_analyses (company_id, youtube_url, status)
      VALUES (?, ?, 'pending')
    `).run(data.company_id || null, data.youtube_url);
    return result.lastInsertRowid;
  },

  updateYoutubeAnalysis(id, data) {
    const fields = Object.keys(data).map(k => `${k}=@${k}`).join(', ');
    db.prepare(`UPDATE youtube_analyses SET ${fields} WHERE id = @id`).run({ ...data, id });
  },

  getYoutubeAnalysis(id) {
    return db.prepare('SELECT * FROM youtube_analyses WHERE id = ?').get(id);
  },

  getAllYoutubeAnalyses() {
    return db.prepare('SELECT * FROM youtube_analyses ORDER BY created_at DESC LIMIT 50').all();
  },

  deleteYoutubeAnalysis(id) {
    db.prepare('DELETE FROM youtube_analyses WHERE id = ?').run(id);
  },

  // ==================== Articles ====================
  createArticle(data) {
    const result = db.prepare(`
      INSERT INTO articles (company_id, title, content, summary, keywords_json, platform, tone, language, word_count, seo_score, hero_image_url, hero_image_prompt, inline_images_json, status)
      VALUES (@company_id, @title, @content, @summary, @keywords_json, @platform, @tone, @language, @word_count, @seo_score, @hero_image_url, @hero_image_prompt, @inline_images_json, @status)
    `).run({
      company_id: data.company_id || null,
      title: data.title || 'Untitled',
      content: data.content || '',
      summary: data.summary || '',
      keywords_json: data.keywords_json || '[]',
      platform: data.platform || 'blog',
      tone: data.tone || 'professional',
      language: data.language || 'de',
      word_count: data.word_count || 0,
      seo_score: data.seo_score || null,
      hero_image_url: data.hero_image_url || null,
      hero_image_prompt: data.hero_image_prompt || null,
      inline_images_json: data.inline_images_json || '[]',
      status: data.status || 'draft'
    });
    return result.lastInsertRowid;
  },

  updateArticle(id, data) {
    const allowed = ['title', 'content', 'summary', 'keywords_json', 'platform', 'tone', 'language', 'word_count', 'seo_score', 'hero_image_url', 'hero_image_prompt', 'inline_images_json', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    if (Object.keys(updates).length === 0) return;
    const fields = Object.keys(updates).map(k => `${k}=@${k}`).join(', ');
    db.prepare(`UPDATE articles SET ${fields} WHERE id = @id`).run({ ...updates, id });
  },

  getArticle(id) {
    return db.prepare('SELECT * FROM articles WHERE id = ?').get(id);
  },

  getAllArticles() {
    return db.prepare('SELECT * FROM articles ORDER BY created_at DESC LIMIT 50').all();
  },

  deleteArticle(id) {
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
  },

  // ==================== Outreach Campaigns ====================
  createCampaign(data) {
    const result = db.prepare(`
      INSERT INTO outreach_campaigns (company_id, platform, campaign_name, target_audience, tone, language, hook, message_body, call_to_action, hashtags_json, image_prompt, image_url, status)
      VALUES (@company_id, @platform, @campaign_name, @target_audience, @tone, @language, @hook, @message_body, @call_to_action, @hashtags_json, @image_prompt, @image_url, @status)
    `).run({
      company_id: data.company_id || null,
      platform: data.platform || 'linkedin',
      campaign_name: data.campaign_name || '',
      target_audience: data.target_audience || '',
      tone: data.tone || 'professional',
      language: data.language || 'de',
      hook: data.hook || '',
      message_body: data.message_body || '',
      call_to_action: data.call_to_action || '',
      hashtags_json: data.hashtags_json || '[]',
      image_prompt: data.image_prompt || null,
      image_url: data.image_url || null,
      status: data.status || 'draft'
    });
    return result.lastInsertRowid;
  },

  updateCampaign(id, data) {
    const allowed = ['platform', 'campaign_name', 'target_audience', 'tone', 'language', 'hook', 'message_body', 'call_to_action', 'hashtags_json', 'image_prompt', 'image_url', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updates[key] = data[key];
    }
    if (Object.keys(updates).length === 0) return;
    const fields = Object.keys(updates).map(k => `${k}=@${k}`).join(', ');
    db.prepare(`UPDATE outreach_campaigns SET ${fields} WHERE id = @id`).run({ ...updates, id });
  },

  getCampaign(id) {
    return db.prepare('SELECT * FROM outreach_campaigns WHERE id = ?').get(id);
  },

  getAllCampaigns() {
    return db.prepare('SELECT * FROM outreach_campaigns ORDER BY created_at DESC LIMIT 50').all();
  },

  deleteCampaign(id) {
    db.prepare('DELETE FROM outreach_campaigns WHERE id = ?').run(id);
  },

  // ==================== Settings ====================
  getSetting(key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  },

  setSetting(key, value) {
    db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`)
      .run(key, value);
  },

  getAllSettings() {
    return db.prepare('SELECT * FROM settings').all();
  }
};
