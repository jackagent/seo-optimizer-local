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

  -- YouTube SEO analyses
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

  -- Generated articles with AI images
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

  -- Social media outreach campaigns
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

  -- API settings (for LLM and image generation)
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

console.log('Database setup complete at:', DB_PATH);
db.close();
