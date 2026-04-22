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

module.exports = {
  // Companies
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

  updateCompany(id, { name, url, description, sector, hosting_platform }) {
    db.prepare('UPDATE companies SET name=?, url=?, description=?, sector=?, hosting_platform=?, updated_at=datetime("now") WHERE id=?')
      .run(name, url, description || null, sector || null, hosting_platform || null, id);
  },

  deleteCompany(id) {
    db.prepare('DELETE FROM companies WHERE id = ?').run(id);
  },

  // Company Details
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

  // Scans
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
    const result = db.prepare('INSERT INTO scans (company_id, status) VALUES (?, "running")').run(companyId);
    return result.lastInsertRowid;
  },

  updateScan(scanId, data) {
    const fields = Object.keys(data).map(k => `${k}=@${k}`).join(', ');
    db.prepare(`UPDATE scans SET ${fields} WHERE id = @id`).run({ ...data, id: scanId });
  },

  getScanHistory(companyId) {
    return db.prepare('SELECT * FROM scans WHERE company_id = ? ORDER BY scanned_at DESC LIMIT 20').all(companyId);
  },

  // Documents
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

  // Dashboard stats
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

    // Count critical issues from latest scans
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

    return {
      totalCompanies: companies.count,
      avgScore: Math.round(avgScore.avg || 0),
      criticalIssues,
      scansToday: scansToday.count
    };
  },

  // Discrepancies
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
  }
};
