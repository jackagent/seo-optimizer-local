const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'seo-optimizer.db');

// Ensure data directory exists
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent access
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Companies table
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    hosting_platform TEXT,
    is_parked_domain INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Company details (registration, governance, contact)
  CREATE TABLE IF NOT EXISTS company_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL UNIQUE,
    company_number TEXT,
    company_type TEXT,
    jurisdiction TEXT,
    registered_address TEXT,
    incorporation_date TEXT,
    vat_number TEXT,
    registered_email TEXT,
    registered_phone TEXT,
    lead_director TEXT,
    lead_director_title TEXT,
    local_director TEXT,
    local_director_title TEXT,
    share_capital TEXT,
    share_type TEXT,
    share_count TEXT,
    share_value TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  -- Scans table
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    overall_score INTEGER,
    meta_score INTEGER,
    content_score INTEGER,
    technical_score INTEGER,
    legal_score INTEGER,
    has_impressum INTEGER,
    has_privacy_policy INTEGER,
    has_terms_of_service INTEGER,
    impressum_completeness INTEGER,
    pages_crawled INTEGER DEFAULT 0,
    issues_json TEXT DEFAULT '[]',
    legal_json TEXT DEFAULT '{}',
    cookie_json TEXT DEFAULT '{}',
    discrepancies_json TEXT DEFAULT '[]',
    scan_data_json TEXT DEFAULT '{}',
    scanned_at TEXT DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  -- Company documents
  CREATE TABLE IF NOT EXISTS company_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'application/pdf',
    category TEXT DEFAULT 'other',
    description TEXT,
    uploaded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );

  -- Generated content / articles
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    platform TEXT DEFAULT 'blog',
    status TEXT DEFAULT 'draft',
    seo_score INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  );
`);

console.log('Database setup complete at:', DB_PATH);
db.close();
