/**
 * Seed Demo Company
 * Creates a realistic demo company with pre-populated scan data, company details,
 * and sample discrepancies so new users can explore all features immediately.
 *
 * Usage: npm run seed
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'seo-optimizer.db');

// Ensure DB exists
if (!fs.existsSync(DB_PATH)) {
  console.log('Database not found. Running setup first...');
  require('./setup-db');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Check if demo company already exists
const existing = db.prepare("SELECT id FROM companies WHERE name = 'Meridian Ventures GmbH (Demo)'").get();
if (existing) {
  console.log('Demo company already exists (ID: ' + existing.id + '). Skipping seed.');
  db.close();
  process.exit(0);
}

console.log('\n  Seeding demo company...\n');

// ==================== 1. Create Demo Company ====================
const companyResult = db.prepare(`
  INSERT INTO companies (name, url, description, sector, hosting_platform, is_parked_domain, is_active)
  VALUES (?, ?, ?, ?, ?, 0, 1)
`).run(
  'Meridian Ventures GmbH (Demo)',
  'example.com',
  'A demo portfolio company to explore Sentinel features. This company demonstrates scan results, legal compliance checks, discrepancy detection, and document management. Delete anytime.',
  'Venture Capital',
  'Custom'
);
const companyId = companyResult.lastInsertRowid;
console.log(`  ✓ Company created (ID: ${companyId})`);

// ==================== 2. Add Company Details ====================
db.prepare(`
  INSERT INTO company_details (
    company_id, company_number, company_type, jurisdiction,
    registered_address, incorporation_date, vat_number,
    registered_email, registered_phone,
    lead_director, lead_director_title,
    local_director, local_director_title,
    share_capital, share_type, share_count
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  companyId,
  'HRB 218456',
  'GmbH',
  'Amtsgericht München',
  'Maximilianstraße 35a, 80539 München',
  '15.03.2021',
  'DE345678901',
  'info@meridian-ventures.de',
  '+49 89 2180 7700',
  'Dr. Alexander Hartmann',
  'Geschäftsführer',
  'Christina Weber',
  'Prokuristin',
  '250.000 EUR',
  'Stammeinlage',
  '25.000'
);
console.log('  ✓ Company details added');

// ==================== 3. Create Completed Scan ====================
const now = new Date().toISOString();

const issues = [
  {
    severity: 'critical',
    category: 'legal',
    title: 'Missing Cookie Consent Banner',
    description: 'No cookie consent banner detected. Required by EU ePrivacy Directive and GDPR for any site using tracking cookies.',
    fix: 'Implement a GDPR-compliant cookie consent banner using a CMP tool such as Cookiebot, Usercentrics, or Borlabs Cookie.'
  },
  {
    severity: 'warning',
    category: 'legal',
    title: 'Missing Terms of Service',
    description: 'No terms of service page found on the website.',
    fix: 'Create a comprehensive AGB/Terms of Service page covering liability, intellectual property, and dispute resolution.'
  },
  {
    severity: 'warning',
    category: 'meta',
    title: 'Meta Description Too Short',
    description: 'Meta description is only 78 characters. Recommended length is 120-160 characters for optimal search result display.',
    fix: 'Expand the meta description to 120-160 characters with relevant keywords and a compelling call to action.'
  },
  {
    severity: 'warning',
    category: 'content',
    title: 'Multiple H1 Tags',
    description: 'Found 3 H1 headings on the homepage. Search engines expect a single H1 per page.',
    fix: 'Consolidate to a single H1 tag containing your primary keyword. Convert other H1s to H2 or H3.'
  },
  {
    severity: 'warning',
    category: 'accessibility',
    title: 'Images Missing Alt Text',
    description: '4 of 12 images lack descriptive alt text, reducing accessibility and SEO value.',
    fix: 'Add descriptive alt text to all images that conveys the image content and context.'
  },
  {
    severity: 'info',
    category: 'meta',
    title: 'Missing Open Graph Tags',
    description: 'No Open Graph title or image meta tags found. Social media shares will lack rich previews.',
    fix: 'Add og:title, og:description, og:image, and og:url meta tags for better social sharing.'
  },
  {
    severity: 'info',
    category: 'technical',
    title: 'Missing Canonical URL',
    description: 'No canonical link element found. This may cause duplicate content issues in search engines.',
    fix: 'Add <link rel="canonical" href="https://example.com/"> to the page head.'
  },
  {
    severity: 'info',
    category: 'technical',
    title: 'Render-Blocking Scripts',
    description: '2 external scripts loaded without async or defer attributes, potentially slowing initial page render.',
    fix: 'Add async for independent scripts or defer for DOM-dependent scripts to improve load performance.'
  }
];

const legalData = {
  impressum: {
    exists: true,
    url: 'https://example.com/impressum',
    content: 'Meridian Ventures GmbH\nMaximilianstraße 35a\n80539 München\nGeschäftsführer: Dr. Alexander Hartmann\nAmtsgericht München HRB 218456\nUSt-IdNr.: DE345678901\nE-Mail: info@meridian-ventures.de\nTelefon: +49 89 2180 7700'
  },
  privacy: {
    exists: true,
    url: 'https://example.com/datenschutz',
    content: 'Datenschutzerklärung gemäß DSGVO...'
  }
};

const cookieData = {
  detected: false,
  hasRejectAll: false,
  hasGranularChoices: false,
  hasNecessaryOnly: false,
  hasCookiePolicy: false,
  score: 0
};

// Discrepancy: the website shows a slightly different address than the DB
const discrepancyData = [
  {
    field: 'Registered Address',
    dbField: 'registered_address',
    dbValue: 'Maximilianstraße 35a, 80539 München',
    websiteValue: 'Maximilianstr. 35a, 80539 München, Deutschland',
    severity: 'critical'
  }
];

const scanData = {
  title: 'Meridian Ventures — Venture Capital & Portfolio Management',
  metaDesc: 'Meridian Ventures is a Munich-based venture capital firm investing in early-stage technology.',
  h1s: ['Meridian Ventures', 'Our Portfolio', 'Contact Us'],
  h2s: ['Investment Focus', 'Team', 'Latest News', 'Our Approach'],
  canonical: '',
  ogTitle: '',
  ogDesc: '',
  ogImage: '',
  viewport: 'width=device-width, initial-scale=1.0',
  favicon: '/favicon.ico',
  lang: 'de',
  robots: '',
  images: 12,
  imagesWithoutAlt: 4,
  internalLinks: 24,
  externalLinks: 8,
  scripts: 6,
  loadTime: 2.3
};

db.prepare(`
  INSERT INTO scans (
    company_id, status, overall_score,
    meta_score, content_score, technical_score, legal_score,
    has_impressum, has_privacy_policy, has_terms_of_service,
    impressum_completeness, pages_crawled,
    issues_json, legal_json, cookie_json,
    discrepancies_json, scan_data_json,
    scanned_at, completed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  companyId,
  'completed',
  68,
  65,
  70,
  78,
  58,
  1,  // has_impressum
  1,  // has_privacy_policy
  0,  // has_terms_of_service
  72, // impressum_completeness
  4,  // pages_crawled
  JSON.stringify(issues),
  JSON.stringify(legalData),
  JSON.stringify(cookieData),
  JSON.stringify(discrepancyData),
  JSON.stringify(scanData),
  now,
  now
);
console.log('  ✓ Scan results seeded (Score: 68/100, 8 issues, 1 discrepancy)');

// ==================== 4. Add a Second Company ====================
const company2Result = db.prepare(`
  INSERT INTO companies (name, url, description, sector, hosting_platform, is_parked_domain, is_active)
  VALUES (?, ?, ?, ?, ?, 0, 1)
`).run(
  'NovaTech Solutions UG (Demo)',
  'novatech-solutions.example.com',
  'A demo SaaS startup to demonstrate scanning of a company with fewer compliance issues.',
  'SaaS / AI',
  'WordPress'
);
const company2Id = company2Result.lastInsertRowid;

db.prepare(`
  INSERT INTO company_details (
    company_id, company_number, company_type, jurisdiction,
    registered_address, incorporation_date, vat_number,
    registered_email, lead_director, lead_director_title
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  company2Id,
  'HRB 312890',
  'UG (haftungsbeschränkt)',
  'Amtsgericht Berlin-Charlottenburg',
  'Friedrichstraße 191, 10117 Berlin',
  '08.11.2023',
  'DE412345678',
  'hello@novatech-solutions.de',
  'Maximilian Fischer',
  'Geschäftsführer'
);

const issues2 = [
  {
    severity: 'warning',
    category: 'meta',
    title: 'Page Title Too Long',
    description: 'Title is 72 characters, exceeding the recommended 60-character limit.',
    fix: 'Shorten the title to under 60 characters for optimal display in search results.'
  },
  {
    severity: 'info',
    category: 'technical',
    title: 'Missing Canonical URL',
    description: 'No canonical link element found.',
    fix: 'Add a canonical URL to prevent duplicate content issues.'
  }
];

const legal2 = {
  impressum: { exists: true, url: 'https://novatech-solutions.example.com/impressum', content: 'NovaTech Solutions UG...' },
  privacy: { exists: true, url: 'https://novatech-solutions.example.com/datenschutz', content: 'Datenschutzerklärung...' },
  terms: { exists: true, url: 'https://novatech-solutions.example.com/agb', content: 'Allgemeine Geschäftsbedingungen...' }
};

const cookie2 = { detected: true, hasRejectAll: true, hasGranularChoices: true, hasNecessaryOnly: true, hasCookiePolicy: true, score: 100 };

db.prepare(`
  INSERT INTO scans (
    company_id, status, overall_score,
    meta_score, content_score, technical_score, legal_score,
    has_impressum, has_privacy_policy, has_terms_of_service,
    impressum_completeness, pages_crawled,
    issues_json, legal_json, cookie_json,
    discrepancies_json, scan_data_json,
    scanned_at, completed_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  company2Id,
  'completed',
  87,
  82,
  90,
  85,
  92,
  1, 1, 1,
  88, 6,
  JSON.stringify(issues2),
  JSON.stringify(legal2),
  JSON.stringify(cookie2),
  '[]',
  JSON.stringify({ title: 'NovaTech Solutions — AI-Powered Business Intelligence', metaDesc: 'NovaTech Solutions builds AI-powered analytics tools for mid-market enterprises. Based in Berlin.', h1s: ['AI-Powered Business Intelligence'], h2s: ['Features', 'Pricing', 'About Us'], canonical: '', ogTitle: 'NovaTech Solutions', ogDesc: 'AI analytics for enterprises', ogImage: '', viewport: 'width=device-width, initial-scale=1.0', favicon: '/favicon.ico', lang: 'de', robots: '', images: 8, imagesWithoutAlt: 0, internalLinks: 18, externalLinks: 4, scripts: 4, loadTime: 1.8 }),
  now,
  now
);
console.log(`  ✓ Second demo company created (NovaTech Solutions, Score: 87/100)`);

// ==================== 5. Create Sample Document ====================
const docsDir = path.join(__dirname, '..', 'data', 'uploads', String(companyId));
fs.mkdirSync(docsDir, { recursive: true });

// Create a simple text file as a sample document
const sampleDocPath = path.join(docsDir, 'handelsregisterauszug-demo.txt');
fs.writeFileSync(sampleDocPath, `HANDELSREGISTERAUSZUG (DEMO)
========================================
Amtsgericht München — HRB 218456

Firma: Meridian Ventures GmbH
Sitz: München
Anschrift: Maximilianstraße 35a, 80539 München

Gegenstand des Unternehmens:
Beteiligung an und Verwaltung von Unternehmen,
insbesondere im Bereich Technologie und Innovation.

Stammkapital: 250.000,00 EUR

Geschäftsführer:
  Dr. Alexander Hartmann, München
  (einzelvertretungsberechtigt)

Prokura:
  Christina Weber, München

Eingetragen am: 15.03.2021

--- This is a demo document for demonstration purposes ---
`);

db.prepare(`
  INSERT INTO company_documents (company_id, file_name, file_path, file_size, mime_type, category, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
  companyId,
  'handelsregisterauszug-demo.txt',
  sampleDocPath,
  fs.statSync(sampleDocPath).size,
  'text/plain',
  'incorporation',
  'Demo: Handelsregisterauszug (Commercial Register Extract)'
);
console.log('  ✓ Sample document created');

// ==================== Done ====================
db.close();

console.log(`
  ✓ Demo seed complete!

  Two demo companies created:
    1. Meridian Ventures GmbH — Score 68/100 (8 issues, 1 discrepancy)
    2. NovaTech Solutions UG  — Score 87/100 (2 issues, fully compliant)

  Start the server with: npm start
  Then open http://localhost:3000

`);
